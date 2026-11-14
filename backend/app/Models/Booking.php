<?php

namespace App\Models;

use App\Support\Phone;
use Carbon\CarbonImmutable;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * A companionship booking requested by a family through the public website.
 *
 * Status workflow (see TRANSITIONS):
 *   pending ──► confirmed ──► completed
 *      │            └───────► cancelled
 *      ├──► rejected
 *      └──► cancelled
 * Rejected, cancelled and completed bookings are final.
 */
#[Fillable([
    'client_name', 'contact_person_name', 'contact_number', 'email',
    'emergency_contact_name', 'emergency_contact_number',
    'service_type', 'booking_date', 'start_time', 'duration_hours',
    'pickup_location', 'destination', 'planned_activity', 'special_instructions',
])]
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_COMPLETED = 'completed';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_REJECTED,
        self::STATUS_CANCELLED,
        self::STATUS_COMPLETED,
    ];

    /** Which status each status may change to. Anything else is refused. */
    public const TRANSITIONS = [
        self::STATUS_PENDING => [self::STATUS_CONFIRMED, self::STATUS_REJECTED, self::STATUS_CANCELLED],
        self::STATUS_CONFIRMED => [self::STATUS_COMPLETED, self::STATUS_CANCELLED],
        self::STATUS_REJECTED => [],
        self::STATUS_CANCELLED => [],
        self::STATUS_COMPLETED => [],
    ];

    /** Must match `value` of SERVICES in frontend/src/content/siteContent.js. */
    public const SERVICE_TYPES = ['errand', 'shopping', 'walking', 'appointment', 'social', 'general'];

    // Booking rules, the same as frontend/src/utils/booking.js.
    public const MIN_DURATION_HOURS = 3;

    public const MAX_DURATION_HOURS = 10;

    public const MAX_DAYS_AHEAD = 180;

    /** A booking must start at least this many hours from now. */
    public const MIN_NOTICE_HOURS = 6;

    private const FIRST_START_HOUR = 7;

    private const LAST_START_HOUR = 17;

    private const REFERENCE_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I/L

    protected static function booted(): void
    {
        // Keep the search and grouping columns in step with what was typed.
        static::saving(function (Booking $booking) {
            $booking->contact_number_normalized = Phone::normalize($booking->contact_number);
            $booking->client_key = self::clientKeyFor($booking->client_name, $booking->contact_number);
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'booking_date' => 'date:Y-m-d',
            'duration_hours' => 'integer',
            'terms_accepted_at' => 'datetime',
        ];
    }

    /** Always stored as HH:MM:SS (what MySQL returns), so unchanged times are not "dirty". */
    protected function startTime(): Attribute
    {
        return Attribute::set(fn (?string $value) => $value !== null && strlen($value) === 5 ? "{$value}:00" : $value);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(BookingActivity::class)->latest('id');
    }

    /* ------------------------------------------------------------ Helpers */

    /**
     * "Today" and "now" in the business time zone, where booking dates live.
     */
    public static function now(): CarbonImmutable
    {
        return CarbonImmutable::now(config('kaagapay.timezone'));
    }

    public static function today(): string
    {
        return self::now()->toDateString();
    }

    /** Allowed start times: 07:00, 07:30, … 17:00. */
    public static function startTimes(): array
    {
        $times = [];
        for ($hour = self::FIRST_START_HOUR; $hour <= self::LAST_START_HOUR; $hour++) {
            $times[] = sprintf('%02d:00', $hour);
            if ($hour < self::LAST_START_HOUR) {
                $times[] = sprintf('%02d:30', $hour);
            }
        }

        return $times;
    }

    /**
     * One client = the same senior's name with the same family contact number.
     * A family booking for two parents from one phone gets two clients.
     */
    public static function clientKeyFor(?string $clientName, ?string $contactNumber): string
    {
        $name = Str::of((string) $clientName)->squish()->lower()->value();

        return sha1(Phone::normalize($contactNumber).'|'.$name);
    }

    public static function generateReference(): string
    {
        do {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= self::REFERENCE_CHARACTERS[random_int(0, strlen(self::REFERENCE_CHARACTERS) - 1)];
            }
            $reference = "KGP-{$code}";
        } while (self::where('reference', $reference)->exists());

        return $reference;
    }

    /** "kgp 7h3-k9q" → "KGP-7H3K9Q", so references typed differently still match. */
    public static function normalizeReference(?string $value): string
    {
        $code = strtoupper(preg_replace('/[^a-z0-9]/i', '', (string) $value));
        if (str_starts_with($code, 'KGP')) {
            $code = substr($code, 3);
        }

        return "KGP-{$code}";
    }

    public function startsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse(
            $this->booking_date->format('Y-m-d').' '.substr($this->start_time, 0, 5),
            config('kaagapay.timezone'),
        );
    }

    public function isFinal(): bool
    {
        return self::TRANSITIONS[$this->status] === [];
    }

    /**
     * Why this booking cannot move to $status right now, or null when it can.
     */
    public function transitionProblem(string $status): ?string
    {
        if (! in_array($status, self::TRANSITIONS[$this->status] ?? [], true)) {
            return match (true) {
                $this->status === $status => "This booking is already {$status}.",
                $this->isFinal() => "This booking is {$this->status} and can no longer be changed.",
                default => "A {$this->status} booking cannot be marked as {$status}.",
            };
        }

        $startsAt = $this->startsAt();

        if ($status === self::STATUS_CONFIRMED && $startsAt->isPast()) {
            return 'The booking date and time have already passed. Reject or cancel it instead.';
        }

        if ($status === self::STATUS_COMPLETED && $startsAt->isFuture()) {
            return 'A booking can only be marked as completed after its start time.';
        }

        return null;
    }

    /**
     * The status buttons an administrator sees, with the reason when one is not possible yet.
     *
     * @return array<int, array{status: string, allowed: bool, reason: string|null}>
     */
    public function availableActions(): array
    {
        return array_map(function (string $status) {
            $problem = $this->transitionProblem($status);

            return ['status' => $status, 'allowed' => $problem === null, 'reason' => $problem];
        }, self::TRANSITIONS[$this->status] ?? []);
    }

    /* ------------------------------------------------------------- Scopes */

    /** Confirmed bookings from today onward. */
    public function scopeUpcoming(Builder $query): void
    {
        $query->where('status', self::STATUS_CONFIRMED)->whereDate('booking_date', '>=', self::today());
    }

    /**
     * Finds bookings by reference, client or contact name, or phone number.
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);
        if ($term === '') {
            return;
        }

        $like = '%'.addcslashes($term, '%_\\').'%';
        $code = preg_replace('/[^A-Z0-9]/', '', strtoupper($term));
        $digits = Phone::normalize($term);

        $query->where(function (Builder $query) use ($like, $code, $digits) {
            $query->where('client_name', 'like', $like)
                ->orWhere('contact_person_name', 'like', $like)
                ->orWhere('reference', 'like', $like);

            if (strlen($code) >= 3) {
                $query->orWhereRaw("REPLACE(reference, '-', '') LIKE ?", ['%'.$code.'%']);
            }

            if (strlen($digits) >= 4) {
                $query->orWhere('contact_number_normalized', 'like', '%'.$digits.'%');
            }
        });
    }

    /* ------------------------------------------------------ API responses */

    /**
     * The only fields the public lookup may show: no phone numbers or addresses.
     *
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'reference' => $this->reference,
            'client_name' => $this->client_name,
            'service_type' => $this->service_type,
            'booking_date' => $this->booking_date->format('Y-m-d'),
            'start_time' => substr($this->start_time, 0, 5),
            'duration_hours' => $this->duration_hours,
            'status' => $this->status,
        ];
    }

    /**
     * One row of the admin bookings table.
     *
     * @return array<string, mixed>
     */
    public function toAdminListArray(): array
    {
        return $this->toPublicArray() + [
            'contact_person_name' => $this->contact_person_name,
            'contact_number' => $this->contact_number,
            'client_key' => $this->client_key,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Everything an administrator needs to handle one booking.
     *
     * @return array<string, mixed>
     */
    public function toAdminArray(): array
    {
        return $this->toAdminListArray() + [
            'email' => $this->email,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_number' => $this->emergency_contact_number,
            'pickup_location' => $this->pickup_location,
            'destination' => $this->destination,
            'planned_activity' => $this->planned_activity,
            'special_instructions' => $this->special_instructions,
            'terms_accepted_at' => $this->terms_accepted_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'is_final' => $this->isFinal(),
            'actions' => $this->availableActions(),
            'activities' => $this->activities->map->toApiArray()->values(),
        ];
    }
}
