<?php

use App\Models\Admin;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

// Usage: php artisan admin:create
Artisan::command('admin:create', function () {
    $data = [
        'name' => text(label: 'Admin name', required: true),
        'email' => text(label: 'Admin email', required: true),
        'password' => password(label: 'Password', required: true, hint: 'At least 12 characters, with upper and lower case letters and a number.'),
    ];
    $data['password_confirmation'] = password(label: 'Confirm password', required: true);

    $validator = Validator::make($data, [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'string', 'email', 'max:255', 'unique:admins,email'],
        'password' => ['required', 'confirmed', Password::defaults()],
    ]);

    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }

    $admin = Admin::create($validator->safe()->only(['name', 'email', 'password']));

    $this->info("Admin account created for {$admin->email}.");

    return 0;
})->purpose('Create a new administrator account');
