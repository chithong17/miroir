import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../data/password_reset_service.dart';

class PasswordResetPage extends StatefulWidget {
  const PasswordResetPage({super.key, required this.accountType});

  final PasswordResetAccountType accountType;

  @override
  State<PasswordResetPage> createState() => _PasswordResetPageState();
}

class _PasswordResetPageState extends State<PasswordResetPage> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _service = PasswordResetService();
  var _step = 0;
  var _isWorking = false;
  var _resendSeconds = 0;
  String _message = '';
  String _error = '';
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _startCooldown(int seconds) {
    _timer?.cancel();
    setState(() => _resendSeconds = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _resendSeconds <= 1) {
        timer.cancel();
        if (mounted) setState(() => _resendSeconds = 0);
        return;
      }
      setState(() => _resendSeconds -= 1);
    });
  }

  Future<void> _requestCode() async {
    final email = _emailController.text.trim();
    if (!email.contains('@')) {
      setState(() => _error = 'Enter a valid email address.');
      return;
    }
    setState(() { _isWorking = true; _error = ''; _message = ''; });
    try {
      final cooldown = await _service.requestCode(email: email, accountType: widget.accountType);
      if (!mounted) return;
      setState(() { _step = 1; _message = 'Check your inbox for the 6-digit code.'; });
      _startCooldown(cooldown);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isWorking = false);
    }
  }

  Future<void> _verifyCode() async {
    if (!RegExp(r'^\d{6}$').hasMatch(_otpController.text.trim())) {
      setState(() => _error = 'Enter the 6-digit verification code.');
      return;
    }
    setState(() { _isWorking = true; _error = ''; _message = ''; });
    try {
      await _service.verifyCode(email: _emailController.text, otp: _otpController.text, accountType: widget.accountType);
      if (mounted) setState(() { _step = 2; _message = 'Code verified. Choose a new password.'; });
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isWorking = false);
    }
  }

  Future<void> _confirmPassword() async {
    if (_passwordController.text.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters.');
      return;
    }
    if (_passwordController.text != _confirmController.text) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    setState(() { _isWorking = true; _error = ''; _message = ''; });
    try {
      await _service.confirm(email: _emailController.text, otp: _otpController.text, password: _passwordController.text, accountType: widget.accountType);
      if (!mounted) return;
      setState(() { _message = 'Password updated. You can now sign in.'; });
      await Future<void>.delayed(const Duration(milliseconds: 900));
      if (mounted) Navigator.of(context).pop();
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _isWorking = false);
    }
  }

  InputDecoration _fieldDecoration(String label, IconData icon) => InputDecoration(
    labelText: label,
    prefixIcon: Icon(icon, color: AppColors.accentStrong),
    filled: true,
    fillColor: AppColors.surface,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.line)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.line)),
  );

  @override
  Widget build(BuildContext context) {
    final accountName = widget.accountType == PasswordResetAccountType.shopOwner ? 'shop owner' : 'customer';
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(backgroundColor: AppColors.canvas, title: const Text('Reset password'), centerTitle: true),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            _StepProgress(current: _step),
            const SizedBox(height: 32),
            Text(_step == 0 ? 'Find your account' : _step == 1 ? 'Verify your email' : 'Set a new password', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text('Reset the password for your $accountName account.', style: const TextStyle(color: AppColors.muted, height: 1.45)),
            const SizedBox(height: 28),
            if (_step == 0) ...[
              TextField(controller: _emailController, keyboardType: TextInputType.emailAddress, decoration: _fieldDecoration('Email address', Icons.email_outlined)),
              const SizedBox(height: 20),
              MiroirButton(label: _isWorking ? 'Sending code...' : 'Send verification code', onPressed: _isWorking ? null : _requestCode),
            ] else if (_step == 1) ...[
              Text('We sent a code to ${_emailController.text.trim()}.', style: const TextStyle(color: AppColors.muted)),
              const SizedBox(height: 20),
              TextField(controller: _otpController, keyboardType: TextInputType.number, maxLength: 6, decoration: _fieldDecoration('6-digit code', Icons.password_rounded)),
              const SizedBox(height: 12),
              MiroirButton(label: _isWorking ? 'Verifying...' : 'Verify code', onPressed: _isWorking ? null : _verifyCode),
              const SizedBox(height: 8),
              TextButton(onPressed: _resendSeconds > 0 || _isWorking ? null : _requestCode, child: Text(_resendSeconds > 0 ? 'Resend available in ${_resendSeconds}s' : 'Resend code')),
            ] else ...[
              TextField(controller: _passwordController, obscureText: true, decoration: _fieldDecoration('New password', Icons.lock_outline_rounded)),
              const SizedBox(height: 16),
              TextField(controller: _confirmController, obscureText: true, decoration: _fieldDecoration('Confirm new password', Icons.lock_reset_rounded)),
              const SizedBox(height: 20),
              MiroirButton(label: _isWorking ? 'Updating...' : 'Update password', onPressed: _isWorking ? null : _confirmPassword),
            ],
            if (_message.isNotEmpty) _Notice(message: _message, color: AppColors.accentStrong),
            if (_error.isNotEmpty) _Notice(message: _error, color: Colors.redAccent),
          ]),
        ),
      ),
    );
  }
}

class _StepProgress extends StatelessWidget {
  const _StepProgress({required this.current});
  final int current;
  @override
  Widget build(BuildContext context) => Row(children: List.generate(3, (index) => Expanded(child: Container(margin: EdgeInsets.only(right: index == 2 ? 0 : 8), height: 6, decoration: BoxDecoration(color: index <= current ? AppColors.accentStrong : AppColors.line, borderRadius: BorderRadius.circular(99))))));
}

class _Notice extends StatelessWidget {
  const _Notice({required this.message, required this.color});
  final String message;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(margin: const EdgeInsets.only(top: 20), padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(16)), child: Text(message, style: TextStyle(color: color, fontWeight: FontWeight.w600)));
}
