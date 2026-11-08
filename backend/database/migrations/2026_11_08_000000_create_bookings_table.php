<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Booking requests sent by families through the public website.
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 12)->unique(); // e.g. KGP-7H3K9Q

            // Client (the senior) and the family contact person
            $table->string('client_name', 100);
            $table->string('contact_person_name', 100);
            $table->string('contact_number', 30);
            // Digits only (09171234567), so numbers typed differently can be searched and compared.
            $table->string('contact_number_normalized', 20)->index();
            $table->string('email')->nullable();
            $table->string('emergency_contact_name', 100);
            $table->string('emergency_contact_number', 30);
            // Groups bookings of the same client (see Booking::clientKeyFor). There is
            // no separate clients table: clients are worked out from their bookings.
            $table->char('client_key', 40)->index();

            // The service
            $table->string('service_type', 30);
            $table->date('booking_date')->index();
            $table->time('start_time');
            $table->unsignedTinyInteger('duration_hours');
            $table->string('pickup_location');
            $table->string('destination');
            $table->string('planned_activity')->nullable();
            $table->text('special_instructions')->nullable();

            $table->string('status', 20)->default('pending')->index();
            $table->timestamp('terms_accepted_at')->nullable();
            $table->timestamps();
        });

        // Everything that happens to a booking after it is sent: status changes,
        // internal admin notes and edits. Shown as a timeline to administrators only.
        Schema::create('booking_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            // Null when the family did it (the booking request itself).
            $table->foreignId('admin_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 20); // created | status | note | update
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20)->nullable();
            $table->text('body')->nullable();
            // Result of the email to the family for a status change: sent | failed | null (not sent).
            $table->string('notification', 20)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_activities');
        Schema::dropIfExists('bookings');
    }
};
