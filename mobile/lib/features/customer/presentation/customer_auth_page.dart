import 'package:flutter/material.dart';

import '../../../core/app/app_session_controller.dart';
import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import 'controllers/customer_auth_controller.dart';

class CustomerAuthPage extends StatefulWidget {
  const CustomerAuthPage({
    super.key,
    required this.mode,
  });

  final CustomerAuthFlow mode;

  @override
  State<CustomerAuthPage> createState() => _CustomerAuthPageState();
}

class _CustomerAuthPageState extends State<CustomerAuthPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  CustomerAuthController? _controller;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _controller ??= CustomerAuthController(
      sessionController: AppSessionScope.of(context),
      mode: widget.mode == CustomerAuthFlow.register
          ? CustomerAuthMode.register
          : CustomerAuthMode.login,
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await _controller!.submit(
      name: _nameController.text,
      email: _emailController.text,
      password: _passwordController.text,
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: AppColors.muted),
      prefixIcon: Icon(icon, color: AppColors.mutedSoft, size: 20),
      filled: true,
      fillColor: const Color(0xFFF4F6F9),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: const BorderSide(color: AppColors.accentStrong, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = AppSessionScope.of(context);
    final isRegister = widget.mode == CustomerAuthFlow.register;
    final textTheme = Theme.of(context).textTheme;

    return ListenableBuilder(
      listenable: _controller!,
      builder: (context, _) {
        return Scaffold(
          body: Stack(
            fit: StackFit.expand,
            children: [
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: MediaQuery.of(context).size.height * 0.5,
                child: Image.asset(
                  'assets/images/auth-bg.png',
                  fit: BoxFit.cover,
                ),
              ),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.3),
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.2),
                      ],
                    ),
                  ),
                ),
              ),
              CustomScrollView(
                slivers: [
                  SliverAppBar(
                    expandedHeight: 260,
                    backgroundColor: Colors.transparent,
                    elevation: 0,
                    pinned: true,
                    leading: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: GlassSurface(
                        radius: 999,
                        blurSigma: 14,
                        padding: EdgeInsets.zero,
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new_rounded,
                              color: Colors.white, size: 18),
                          onPressed: session.showAuthChoice,
                        ),
                      ),
                    ),
                    flexibleSpace: FlexibleSpaceBar(
                      titlePadding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                      title: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'MIROIR',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2.0,
                              color: Colors.white70,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isRegister
                                ? 'Create Your Account\nand Start Styling'
                                : 'Log in to stay on\ntop of your wardrobe.',
                            style: textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              height: 1.2,
                              shadows: [
                                Shadow(
                                  color: Colors.black.withValues(alpha: 0.3),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      background: Stack(
                        children: [
                          Positioned(
                            top: -60,
                            right: -40,
                            child: Icon(
                              Icons.auto_awesome_rounded,
                              size: 240,
                              color: Colors.white.withValues(alpha: 0.25),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Container(
                      constraints: BoxConstraints(
                        minHeight: MediaQuery.of(context).size.height - 260 + kToolbarHeight,
                      ),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                      ),
                      padding: const EdgeInsets.fromLTRB(28, 36, 28, 48),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              isRegister ? 'Sign up' : 'Login',
                              textAlign: TextAlign.center,
                              style: textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  isRegister
                                      ? 'Already have an account? '
                                      : 'Don\'t have an account? ',
                                  style: textTheme.bodyMedium?.copyWith(color: AppColors.muted),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    if (isRegister) {
                                      session.openLogin();
                                    } else {
                                      session.openRegister();
                                    }
                                  },
                                  child: Text(
                                    isRegister ? 'Login' : 'Sign Up',
                                    style: textTheme.bodyMedium?.copyWith(
                                      color: AppColors.accentStrong,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 36),
                            if (isRegister) ...[
                              TextFormField(
                                controller: _nameController,
                                decoration: _inputDecoration('Full Name', Icons.person_outline_rounded),
                                validator: (value) {
                                  if (isRegister && (value == null || value.trim().isEmpty)) {
                                    return 'Name is required.';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                            ],
                            TextFormField(
                              controller: _emailController,
                              decoration: _inputDecoration('Email Address', Icons.email_outlined),
                              keyboardType: TextInputType.emailAddress,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Email is required.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: true,
                              decoration: _inputDecoration('Password', Icons.lock_outline_rounded),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Password is required.';
                                }
                                if (isRegister && value.length < 6) {
                                  return 'Password must be at least 6 characters.';
                                }
                                return null;
                              },
                            ),
                            if (!isRegister) ...[
                              const SizedBox(height: 12),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () {},
                                  style: TextButton.styleFrom(
                                    foregroundColor: AppColors.accentStrong,
                                  ),
                                  child: const Text('Forgot Password?'),
                                ),
                              ),
                            ] else ...[
                              const SizedBox(height: 24),
                            ],
                            if (_controller!.errorMessage.isNotEmpty) ...[
                              Container(
                                padding: const EdgeInsets.all(12),
                                margin: const EdgeInsets.only(bottom: 24),
                                decoration: BoxDecoration(
                                  color: AppColors.dangerSoft,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 20),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _controller!.errorMessage,
                                        style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w500),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            MiroirButton(
                              label: _controller!.isSubmitting
                                  ? 'Working...'
                                  : isRegister
                                      ? 'Sign up'
                                      : 'Login',
                              onPressed: _controller!.isSubmitting ? null : () => _submit(),
                              icon: null,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
