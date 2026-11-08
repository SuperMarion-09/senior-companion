<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One entry on a booking's timeline: the request itself, a status change,
 * an internal note or an edit. Only administrators ever see these.
 */
#[Fillable(['admin_id', 'type', 'from_status', 'to_status', 'body', 'notification'])]
class BookingActivity extends Model
{
    public const TYPE_CREATED = 'created';

    public const TYPE_STATUS = 'status';

    public const TYPE_NOTE = 'note';

    public const TYPE_UPDATE = 'update';

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'body' => $this->body,
            'notification' => $this->notification,
            'admin_name' => $this->admin?->name,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
