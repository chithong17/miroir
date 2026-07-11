import 'package:flutter/material.dart';

import '../../../core/app/app_session_controller.dart';
import '../../../core/app/app_session_scope.dart';
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

  @override
  Widget build(BuildContext context) {
    final session = AppSessionScope.of(context);
    final isRegister = widget.mode == CustomerAuthFlow.register;

    return ListenableBuilder(
      listenable: _controller!,
      builder: (context, _) {
        return Scaffold(
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 460),
                  child: GlassSurface(
                    radius: 34,
                    blurSigma: 18,
                    padding: const EdgeInsets.all(22),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextButton.icon(
                            onPressed: session.showAuthChoice,
                            icon: const Icon(Icons.arrow_back_rounded),
                            label: const Text('Back'),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            isRegister
                                ? 'Create your account'
                                : 'Login to MIROIR',
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            isRegister
                                ? 'Create a customer account to save your fitting profile and continue from any device.'
                                : 'Use your customer account to keep your profile, stylist context, and saved try-on photo.',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 18),
                          if (isRegister) ...[
                            TextFormField(
                              controller: _nameController,
                              decoration:
                                  const InputDecoration(labelText: 'Name'),
                              validator: (value) {
                                if (isRegister &&
                                    (value == null || value.trim().isEmpty)) {
                                  return 'Name is required.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 12),
                          ],
                          TextFormField(
                            controller: _emailController,
                            decoration:
                                const InputDecoration(labelText: 'Email'),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Email is required.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: true,
                            decoration:
                                const InputDecoration(labelText: 'Password'),
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
                          if (_controller!.errorMessage.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              _controller!.errorMessage,
                              style: const TextStyle(color: Colors.redAccent),
                            ),
                          ],
                          const SizedBox(height: 18),
                          MiroirButton(
                            label: _controller!.isSubmitting
                                ? 'Working...'
                                : isRegister
                                    ? 'Register'
                                    : 'Login',
                            onPressed: _controller!.isSubmitting
                                ? null
                                : () => _submit(),
                            icon: isRegister
                                ? Icons.person_add_alt_1_rounded
                                : Icons.lock_open_rounded,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
