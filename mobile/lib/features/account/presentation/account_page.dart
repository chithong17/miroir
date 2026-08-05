import 'package:flutter/material.dart';

import '../../../core/app/app_session_controller.dart';
import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/section_card.dart';
import '../../../core/i18n/app_localizations.dart';
import '../../commerce/presentation/commerce_pages.dart';
import 'favorite_products_page.dart';
import 'owner_center_page.dart';

class AccountPage extends StatelessWidget {
  const AccountPage({super.key});

  @override
  Widget build(BuildContext context) {
    final session = AppSessionScope.of(context);
    final textTheme = Theme.of(context).textTheme;

    return ListenableBuilder(
      listenable: session,
      builder: (context, _) {
        final user = session.currentUser;

        return Scaffold(
          backgroundColor: AppColors.canvas,
          body: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 120,
                backgroundColor: AppColors.canvas,
                elevation: 0,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  titlePadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                  title: Text(
                    'Profile',
                    style: textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 120),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    if (user == null) ...[
                      _GuestView(session: session),
                    ] else ...[
                      _UserProfileHeader(
                        name: user.name,
                        email: user.email,
                        imageUrl: user.profile.modelImageUrl,
                      ),
                      const SizedBox(height: 32),
                      _SubscriptionSummary(session: session),
                      const SizedBox(height: 32),
                      _MenuSection(
                        title: 'ACCOUNT',
                        items: [
                          _MenuItem(
                            icon: Icons.edit_outlined,
                            label: 'Edit Profile',
                            onTap: session.openProfileOnboarding,
                          ),
                          _MenuItem(
                            icon: Icons.favorite_border_rounded,
                            label: 'Saved Items',
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => const FavoriteProductsPage(),
                              ),
                            ),
                          ),
                          _MenuItem(icon: Icons.shopping_bag_outlined, label: 'My bag', onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CartPage()))),
                          _MenuItem(icon: Icons.receipt_long_outlined, label: 'My orders', onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const OrdersPage()))),
                          _MenuItem(icon: Icons.location_on_outlined, label: 'Addresses', onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AddressesPage()))),
                          _MenuItem(icon: Icons.notifications_none_rounded, label: 'Notifications', onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsPage()))),
                          _MenuItem(
                            icon: Icons.storefront_rounded,
                            label: 'Owner Center',
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => const OwnerCenterPage(),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      _MenuSection(

                        title: 'SETTINGS',

                        items: [

                          _MenuItem(

                            icon: Icons.language_rounded,

                            label: AppLocalizations.t(context, 'account.language'),

                            onTap: () {

                              final current = LanguageController.of(context).languageCode;

                              final next = current == 'en' ? 'vi' : 'en';

                              LanguageController.of(context).setLanguage(next);

                            },

                          ),

                          _MenuItem(

                            icon: Icons.logout_rounded,
                            label: 'Logout',
                            isDestructive: true,
                            onTap: () => session.logout(),
                          ),
                        ],
                      ),
                    ],
                  ]),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _GuestView extends StatelessWidget {
  const _GuestView({required this.session});
  final AppSessionController session;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      radius: 32,
      blurSigma: 16,
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.accentStrong.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person_outline_rounded,
                size: 48, color: AppColors.accentStrong),
          ),
          const SizedBox(height: 24),
          Text(
            'Guest Mode',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          Text(
            'Sign in to save your fitting profile, keep your personalized styling, and use the try-on studio.',
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: AppColors.muted, height: 1.5),
          ),
          const SizedBox(height: 32),
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
          MiroirButton(
            label: 'Owner Center',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const OwnerCenterPage()),
            ),
            icon: Icons.storefront_rounded,
            isSecondary: true,
          ),
        ],
      ),
    );
  }
}

class _UserProfileHeader extends StatelessWidget {
  const _UserProfileHeader({
    required this.name,
    required this.email,
    required this.imageUrl,
  });
  final String name;
  final String email;
  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.accentStrong.withValues(alpha: 0.2),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 4),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
            image: imageUrl.isNotEmpty
                ? DecorationImage(
                    image: NetworkImage(imageUrl),
                    fit: BoxFit.cover,
                  )
                : null,
          ),
          child: imageUrl.isEmpty
              ? Center(
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'U',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: AppColors.accentStrong,
                    ),
                  ),
                )
              : null,
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                email,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppColors.muted),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SubscriptionSummary extends StatelessWidget {
  const _SubscriptionSummary({required this.session});
  final AppSessionController session;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      padding: const EdgeInsets.all(24),
      color: AppColors.accentSoft.withValues(alpha: 0.5),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.auto_awesome_rounded, color: AppColors.accentStrong),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('MIROIR access', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text('Try-On, AI Stylist, and shop details are available with your account.', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.muted, height: 1.4)),
          ])),
        ],
      ),
    );
  }
}
class _MenuSection extends StatelessWidget {
  const _MenuSection({required this.title, required this.items});
  final String title;
  final List<_MenuItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 12),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.muted,
                  letterSpacing: 1.2,
                ),
          ),
        ),
        SectionCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  ListTile(
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    leading: Icon(
                      item.icon,
                      color:
                          item.isDestructive ? Colors.redAccent : AppColors.ink,
                    ),
                    title: Text(
                      item.label,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                        color: item.isDestructive
                            ? Colors.redAccent
                            : AppColors.ink,
                      ),
                    ),
                    trailing: const Icon(Icons.chevron_right_rounded,
                        color: AppColors.mutedSoft),
                    onTap: item.onTap,
                  ),
                  if (index < items.length - 1)
                    const Divider(height: 1, indent: 60, color: AppColors.line),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _MenuItem {
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;
}

