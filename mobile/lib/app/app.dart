import 'package:flutter/material.dart';

import '../core/app/app_session_controller.dart';
import '../core/app/app_session_scope.dart';
import '../core/theme/app_theme.dart';
import '../features/navigation/app_shell.dart';
import '../features/onboarding/presentation/onboarding_page.dart';

class MiroirApp extends StatefulWidget {
  const MiroirApp({super.key});

  @override
  State<MiroirApp> createState() => _MiroirAppState();
}

class _MiroirAppState extends State<MiroirApp> {
  late final AppSessionController _sessionController;

  @override
  void initState() {
    super.initState();
    _sessionController = AppSessionController();
    _sessionController.restoreSession();
  }

  @override
  void dispose() {
    _sessionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppSessionScope(
      controller: _sessionController,
      child: AnimatedBuilder(
        animation: _sessionController,
        builder: (context, _) {
          return MaterialApp(
            title: 'MIROIR',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            home: _sessionController.isRestoring
                ? const _AppBootstrapScreen()
                : _sessionController.shouldShowOnboarding
                    ? const OnboardingPage()
                    : const AppShell(),
          );
        },
      ),
    );
  }
}

class _AppBootstrapScreen extends StatelessWidget {
  const _AppBootstrapScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
