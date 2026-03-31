<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            background-color: #f4f4f8;
            padding: 32px 16px;
            color: #1a1a1a;
        }
        .wrapper {
            max-width: 520px;
            margin: 0 auto;
        }
        .card {
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .header {
            background: linear-gradient(135deg, #6200EE 0%, #007bff 100%);
            padding: 40px 32px 36px;
            text-align: center;
        }
        .header-icon {
            width: 64px;
            height: 64px;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 16px;
        }
        .header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.3px;
        }
        .header p {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin-top: 6px;
        }
        .body {
            padding: 32px;
        }
        .greeting {
            font-size: 16px;
            color: #1a1a1a;
            margin-bottom: 12px;
        }
        .message {
            font-size: 15px;
            color: #555555;
            line-height: 1.6;
            margin-bottom: 28px;
        }
        .code-label {
            font-size: 11px;
            font-weight: 700;
            color: #888888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .code-box {
            background: #f8f0ff;
            border: 2px dashed #6200EE;
            border-radius: 14px;
            text-align: center;
            padding: 22px 24px;
            margin-bottom: 28px;
        }
        .code {
            font-size: 40px;
            font-weight: 800;
            letter-spacing: 14px;
            color: #6200EE;
            font-variant-numeric: tabular-nums;
        }
        .expiry {
            font-size: 13px;
            color: #888888;
            text-align: center;
            margin-bottom: 24px;
        }
        .expiry strong {
            color: #555555;
        }
        .divider {
            height: 1px;
            background: #eeeeee;
            margin: 24px 0;
        }
        .warning {
            font-size: 13px;
            color: #888888;
            line-height: 1.6;
        }
        .footer {
            text-align: center;
            padding: 20px 32px 28px;
            font-size: 12px;
            color: #aaaaaa;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="card">
            <div class="header">
                <div class="header-icon">🔐</div>
                <h1>Reset Your Password</h1>
                <p>Use the code below to set a new password</p>
            </div>

            <div class="body">
                <p class="greeting">Hi {{ $name }},</p>
                <p class="message">
                    We received a request to reset the password for your account.
                    Enter the code below in the app to continue.
                </p>

                <p class="code-label">Your reset code</p>
                <div class="code-box">
                    <div class="code">{{ $code }}</div>
                </div>

                <p class="expiry">
                    This code expires in <strong>15 minutes</strong>.
                </p>

                <div class="divider"></div>

                <p class="warning">
                    If you didn't request a password reset, you can safely ignore this email.
                    Your password will remain unchanged.
                </p>
            </div>

            <div class="footer">
                &copy; {{ date('Y') }} FitnessApp &mdash; This is an automated message, please do not reply.
            </div>
        </div>
    </div>
</body>
</html>
