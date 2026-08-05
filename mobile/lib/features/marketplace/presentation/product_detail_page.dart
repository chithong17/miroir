import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_pill.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/section_card.dart';
import '../../payments/presentation/premium_paywall_sheet.dart';
import '../../try_on/presentation/try_on_page.dart';
import '../data/catalog_models.dart';
import '../data/catalog_service.dart';
import 'widgets/product_feedback_card.dart';
import 'shop_detail_page.dart';


class ProductDetailPage extends StatelessWidget {
  const ProductDetailPage({
    super.key,
    required this.product,
  });

  final CatalogProduct product;

  @override
  Widget build(BuildContext context) {
    final session = AppSessionScope.of(context);
    final textTheme = Theme.of(context).textTheme;
    final shop = product.shop;
    final isFavorite =
        session.currentUser?.favoriteProductIds.contains(product.id) ?? false;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: _ProductHero(product: product),
              ),
              SliverToBoxAdapter(
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(32)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 132),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _HeaderBlock(product: product),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            if (product.gender.isNotEmpty)
                              _InfoChip(
                                icon: Icons.groups_2_outlined,
                                label: product.gender,
                              ),
                            if (product.availability.isNotEmpty)
                              _InfoChip(
                                icon: Icons.circle,
                                label:
                                    product.availability.replaceAll('_', ' '),
                                iconColor: const Color(0xFF31B56A),
                              ),
                          ],
                        ),
                        if (product.description.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          Text(
                            'About this piece',
                            style: textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            product.description,
                            style: textTheme.bodyMedium?.copyWith(
                              color: AppColors.muted,
                              height: 1.5,
                            ),
                          ),
                        ],
                        const SizedBox(height: 28),
                        Text(
                          'Product profile',
                          style: textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Key details for styling and fit.',
                          style: textTheme.bodySmall?.copyWith(
                            color: AppColors.muted,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Column(
                          children: [
                            Row(
                              children: [
                                _MetaCard(
                                  label: 'Material',
                                  value: _fallbackValue(product.material),
                                ),
                                const SizedBox(width: 12),
                                _MetaCard(
                                  label: 'Fit',
                                  value: _fallbackValue(product.fitType),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                _MetaCard(
                                  label: 'Gender',
                                  value: _fallbackValue(product.gender),
                                ),
                                const SizedBox(width: 12),
                                _MetaCard(
                                  label: 'Status',
                                  value: _fallbackValue(
                                    product.availability.replaceAll('_', ' '),
                                  ),
                                  emphasizeSuccess:
                                      product.availability == 'in_stock',
                                ),
                              ],
                            ),
                          ],
                        ),
                        if (product.sizes.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          Text(
                            'Available sizes',
                            style: textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Quick view for supported sizing.',
                            style: textTheme.bodySmall?.copyWith(
                              color: AppColors.muted,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: product.sizes
                                .map((size) => _SizeChip(label: size))
                                .toList(),
                          ),
                        ],
                        if (product.colors.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          Text(
                            'Color story',
                            style: textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: product.colors
                                .map((color) => GlassPill(label: color))
                                .toList(),
                          ),
                        ],
                        if (product.styleTags.isNotEmpty ||
                            product.occasionTags.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          Text(
                            'Styling tags',
                            style: textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 12),
                          if (product.styleTags.isNotEmpty)
                            _TagBlock(label: 'Style', tags: product.styleTags),
                          if (product.occasionTags.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            _TagBlock(
                                label: 'Occasion', tags: product.occasionTags),
                          ],
                        ],
                        if (shop != null) ...[
                          const SizedBox(height: 28),
                          _ShopSection(shop: shop),
                        ] else if (product.premiumShopDetailsRequired) ...[
                          const SizedBox(height: 28),
                          _PremiumShopHint(product: product),
                        ],
                        const SizedBox(height: 28),
                        ProductFeedbackCard(product: product),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GlassSurface(
                    radius: 999,
                    blurSigma: 14,
                    padding: EdgeInsets.zero,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new_rounded,
                          color: AppColors.ink, size: 20),
                      onPressed: () => Navigator.of(context).maybePop(),
                    ),
                  ),
                  GlassSurface(
                    radius: 999,
                    blurSigma: 14,
                    padding: EdgeInsets.zero,
                    child: IconButton(
                      icon: Icon(
                        isFavorite
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        color: isFavorite ? Colors.red : AppColors.ink,
                        size: 20,
                      ),
                      onPressed: () {
                        if (session.requiresLogin) {
                          session.openLogin();
                        } else {
                          session.toggleFavorite(product.id);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(18, 8, 18, 12),
        child: GlassSurface(
          radius: 34,
          blurSigma: 18,
          shadowOpacity: 0.15,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatMoney(product.price),
                      style: textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Price',
                      style: textTheme.bodySmall?.copyWith(
                        color: AppColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                flex: 1,
                child: MiroirButton(
                  label: 'Try On',
                  onPressed: () => _openTryOn(context),
                  icon: Icons.checkroom_rounded,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openTryOn(BuildContext context) {
    final session = AppSessionScope.of(context);
    if (!session.isSignedIn) {
      showDialog<void>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text('Sign in required'),
            content: const Text(
              'Browse is available in guest mode, but save-your-profile flows and product try-on entry work best after login.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                  Navigator.of(context).maybePop();
                  session.openLogin();
                },
                child: const Text('Login'),
              ),
              TextButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                  Navigator.of(context).maybePop();
                  session.openRegister();
                },
                child: const Text('Register'),
              ),
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text('Later'),
              ),
            ],
          );
        },
      );
      return;
    }

    if (session.isTryOnQuotaExhausted) {
      showPremiumPaywall(
        context,
        session: session,
        reason:
            'You have used all free try-on credits this month. Upgrade to open Studio without limits.',
      );
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => TryOnPage(prefilledProduct: product)),
    );
  }
}

class _ProductHero extends StatelessWidget {
  const _ProductHero({required this.product});

  final CatalogProduct product;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 480,
      child: Stack(
        fit: StackFit.expand,
        children: [
          product.imageUrl.isNotEmpty
              ? Image.network(
                  product.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const _ProductImageFallback(),
                )
              : const _ProductImageFallback(),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.08),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.15),
                ],
              ),
            ),
          ),

        ],
      ),
    );
  }
}

class _HeaderBlock extends StatelessWidget {
  const _HeaderBlock({required this.product});

  final CatalogProduct product;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const GlassPill(
          label: 'FEATURED PIECE',
          icon: Icons.auto_awesome,
        ),
        const SizedBox(height: 12),
        Text(
          product.name,
          style: textTheme.displaySmall?.copyWith(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.8,
            height: 1.1,
          ),
        ),
      ],
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
    this.iconColor,
  });

  final IconData icon;
  final String label;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: iconColor ?? AppColors.ink),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}

class _MetaCard extends StatelessWidget {
  const _MetaCard({
    required this.label,
    required this.value,
    this.emphasizeSuccess = false,
  });

  final String label;
  final String value;
  final bool emphasizeSuccess;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: SectionCard(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        radius: 16,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.mutedSoft,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: emphasizeSuccess
                        ? const Color(0xFF28AF63)
                        : AppColors.ink,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SizeChip extends StatelessWidget {
  const _SizeChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.line),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}

class _ShopSection extends StatelessWidget {
  const _ShopSection({required this.shop});

  final CatalogShop shop;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ShopDetailPage(shop: shop),
          ),
        );
      },
      child: SectionCard(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Shop',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppColors.muted),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Seller details attached to this catalog item.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.muted,
                  ),
            ),
            const SizedBox(height: 14),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: SizedBox(
                    width: 54,
                    height: 54,
                    child: shop.logoUrl.isNotEmpty
                        ? Image.network(
                            shop.logoUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _shopLogoFallback(),
                          )
                        : _shopLogoFallback(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        shop.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      if (shop.slug.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          '@${shop.slug}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.muted,
                              ),
                        ),
                      ],
                      if (shop.description.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          shop.description,
                          style: Theme.of(context).textTheme.bodySmall,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _shopLogoFallback() {
    return Container(
      color: AppColors.elevated,
      alignment: Alignment.center,
      child: const Icon(Icons.storefront_rounded, color: AppColors.ink, size: 20),
    );
  }
}

class _TagBlock extends StatelessWidget {
  const _TagBlock({required this.label, required this.tags});

  final String label;
  final List<String> tags;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.muted,
              ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: tags.map((tag) => GlassPill(label: tag)).toList(),
        ),
      ],
    );
  }
}

class _DotIndicator extends StatelessWidget {
  const _DotIndicator({this.isActive = false});

  final bool isActive;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: isActive ? 11 : 9,
      height: isActive ? 11 : 9,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: isActive ? Colors.white : Colors.white.withValues(alpha: 0.45),
        shape: BoxShape.circle,
      ),
    );
  }
}

class _ProductImageFallback extends StatelessWidget {
  const _ProductImageFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.elevated,
      alignment: Alignment.center,
      child: const Icon(
        Icons.image_not_supported_outlined,
        size: 44,
        color: AppColors.ink,
      ),
    );
  }
}

class _PremiumShopHint extends StatelessWidget {
  const _PremiumShopHint({required this.product});

  final CatalogProduct product;

  @override
  Widget build(BuildContext context) {
    final session = AppSessionScope.of(context);
    return SectionCard(
      padding: const EdgeInsets.all(18),
      color: const Color(0xFFF7F9FC),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Shop details are Premium',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(
            'Upgrade to view shop name, contact details, and more trusted buying context.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.muted,
                ),
          ),
          const SizedBox(height: 14),
          MiroirButton(
            label:
                session.isSignedIn ? 'Upgrade to Premium' : 'Login to unlock',
            onPressed: () {
              if (!session.isSignedIn) {
                Navigator.of(context).maybePop();
                session.openLogin();
                return;
              }
              showPremiumPaywall(
                context,
                session: session,
                reason: 'Premium unlocks shop details and unlimited try-on.',
              );
            },
            icon: Icons.workspace_premium_rounded,
            isSecondary: true,
          ),
        ],
      ),
    );
  }
}


String _formatMoney(double value) {
  final rounded = value.round().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < rounded.length; i++) {
    final reverseIndex = rounded.length - i;
    buffer.write(rounded[i]);
    if (reverseIndex > 1 && reverseIndex % 3 == 1) {
      buffer.write('.');
    }
  }
  return '${buffer.toString()} VND';
}

String _fallbackValue(String value) {
  final trimmed = value.trim();
  return trimmed.isEmpty ? 'Not provided' : trimmed;
}
