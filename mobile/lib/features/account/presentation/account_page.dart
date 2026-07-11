import 'package:flutter/material.dart';

import '../../../core/app/app_session_controller.dart';
import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../payments/presentation/premium_paywall_sheet.dart';

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});

  @override
  Widget build(BuildContext context) {
    final session = AppSessionScope.of(context);

    return ListenableBuilder(
      listenable: session,
      builder: (context, _) {
        final user = session.currentUser;

        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 132),
          children: [
            Text('Account', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              user == null
                  ? 'Browse as a guest or sign in to save your fitting profile and continue across devices.'
                  : 'Manage your profile, session, and app diagnostics here.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 18),
            if (user == null)
              GlassSurface(
                radius: 30,
                blurSigma: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Guest mode',
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 8),
                    const Text(
                      'You can browse products and outfits right now. Sign in when you want saved profile details, profile photo, and smoother personalized flows.',
                    ),
                    const SizedBox(height: 16),
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
                  ],
                ),
              )
            else
              GlassSurface(
                radius: 30,
                blurSigma: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name,
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text(user.email),
                    const SizedBox(height: 8),
                    _SubscriptionSummary(session: session),
                    const SizedBox(height: 8),
                    Text('Status: ${user.status}'),
                    const SizedBox(height: 8),
                    Text(
                      user.needsProfileOnboarding
                          ? 'Profile onboarding is still incomplete.'
                          : 'Profile is ready for customer flows.',
                    ),
                    const SizedBox(height: 16),
                    MiroirButton(
                      label: 'Edit profile',
                      onPressed: session.openProfileOnboarding,
                      icon: Icons.edit_outlined,
                      isSecondary: true,
                    ),
                    const SizedBox(height: 12),
                    MiroirButton(
                      label: 'Logout',
                      onPressed: () => session.logout(),
                      icon: Icons.logout_rounded,
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),
            _DiagnosticsCard(session: session),
            if (session.sessionMessage.isNotEmpty) ...[
              const SizedBox(height: 16),
              GlassSurface(
                radius: 24,
                child: Text(session.sessionMessage),
              ),
            ],
          ],
        );
      },
    );
  }
}

class _SubscriptionSummary extends StatelessWidget {
  const _SubscriptionSummary({required this.session});

  final AppSessionController session;

  @override
  Widget build(BuildContext context) {
    final user = session.currentUser;
    final subscription = user?.subscription;
    final usage = subscription?.usage;
    final isPremium = subscription?.isPremium ?? false;
    final quotaText = isPremium
        ? 'Unlimited try-on previews'
        : usage == null
            ? 'Free plan: 5 try-on previews/month'
            : '${usage.remaining ?? 0}/${usage.limit ?? 5} free try-on previews left';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isPremium
                    ? Icons.workspace_premium_rounded
                    : Icons.lock_open_rounded,
                color: AppColors.ink,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isPremium ? 'Premium active' : 'Free account',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(quotaText),
          if (subscription?.expiresAt != null &&
              subscription!.expiresAt!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text('Expires: ${subscription.expiresAt}'),
          ],
          if (!isPremium) ...[
            const SizedBox(height: 12),
            MiroirButton(
              label: 'Upgrade to Premium',
              onPressed: () => showPremiumPaywall(
                context,
                session: session,
                reason:
                    'Premium unlocks unlimited try-on, AI Stylist, and shop details.',
              ),
              icon: Icons.workspace_premium_rounded,
              isSecondary: true,
            ),
          ],
        ],
      ),
    );
  }
}

class _DiagnosticsCard extends StatelessWidget {
  const _DiagnosticsCard({required this.session});

  final AppSessionController session;

  @override
  Widget build(BuildContext context) {
    final healthy = session.backendHealthy;
    final statusText = healthy == null
        ? 'Not checked yet'
        : healthy
            ? 'Healthy'
            : 'Unavailable';

    return GlassSurface(
      radius: 30,
      blurSigma: 16,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Diagnostics', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          Text('API base URL: ${session.apiBaseUrl}'),
          const SizedBox(height: 4),
          Text('Platform: ${session.platformLabel}'),
          const SizedBox(height: 4),
          Text('Backend health: $statusText'),
          if (session.healthMessage.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(session.healthMessage),
          ],
          const SizedBox(height: 12),
          const Text(
            'For a real Android phone, pass your LAN backend URL through --dart-define=API_BASE_URL=http://YOUR_IP:5000/api.',
          ),
          const SizedBox(height: 16),
          MiroirButton(
            label: session.isCheckingHealth
                ? 'Checking Backend...'
                : 'Run Health Check',
            onPressed: session.isCheckingHealth
                ? null
                : () => session.checkBackendHealth(),
            icon: Icons.monitor_heart_outlined,
            isSecondary: true,
          ),
        ],
      ),
    );
  }
}
