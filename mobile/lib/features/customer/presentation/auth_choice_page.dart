import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';

class AuthChoicePage extends StatelessWidget {
  const AuthChoicePage({super.key});

  @override
  Widget build(BuildContext context) {
    final session = AppSessionScope.of(context);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFAFBFC),
              Color(0xFFF3F6F9),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('MIROIR', style: textTheme.headlineSmall),
                const SizedBox(height: 18),
                Expanded(
                  child: Center(
                    child: GlassSurface(
                      radius: 34,
                      blurSigma: 18,
                      padding: const EdgeInsets.all(22),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Start your fashion flow',
                              style: textTheme.headlineMedium),
                          const SizedBox(height: 10),
                          Text(
                            'Sign in to keep your profile and personalized styling, or continue as a guest to browse the marketplace first.',
                            style: textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 20),
                          MiroirButton(
                            label: 'Login',
                            onPressed: session.openLogin,
                            icon: Icons.lock_open_rounded,
                          ),
                          const SizedBox(height: 12),
                          MiroirButton(
                            label: 'Register',
                            onPressed: session.openRegister,
                            icon: Icons.person_add_alt_1_rounded,
                            isSecondary: true,
                          ),
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: () => session.continueAsGuest(),
                            child: const Text('Continue as guest'),
                          ),
                          const SizedBox(height: 10),
                          const Text(
                            'Guest mode can browse products and outfits. Sign in later for saved profile, profile photo, and personalized flows.',
                            style:
                                TextStyle(color: AppColors.muted, height: 1.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
