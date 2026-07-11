import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_pill.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/surface_icon_button.dart';
import '../../payments/presentation/premium_paywall_sheet.dart';
import '../../try_on/presentation/try_on_page.dart';
import '../data/catalog_models.dart';
import '../data/catalog_service.dart';

class ProductDetailPage extends StatelessWidget {
  const ProductDetailPage({
    super.key,
    required this.product,
  });

  final CatalogProduct product;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final shop = product.shop;

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
                        BorderRadius.vertical(top: Radius.circular(28)),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(18, 18, 18, 132),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _HeaderBlock(product: product),
                        const SizedBox(height: 14),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
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
                          const SizedBox(height: 22),
                          Text(
                            'About this piece',
                            style: textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            product.description,
                            style: textTheme.bodyLarge?.copyWith(
                              color: AppColors.muted,
                              height: 1.5,
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        Text(
                          'Product profile',
                          style: textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Key details for styling and fit.',
                          style: textTheme.bodyLarge?.copyWith(
                            color: AppColors.muted,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            _MetaCard(
                              label: 'Material',
                              value: _fallbackValue(product.material),
                            ),
                            _MetaCard(
                              label: 'Fit',
                              value: _fallbackValue(product.fitType),
                            ),
                            _MetaCard(
                              label: 'Gender',
                              value: _fallbackValue(product.gender),
                            ),
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
                        if (product.sizes.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          Text(
                            'Available sizes',
                            style: textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Quick view for supported sizing.',
                            style: textTheme.bodyLarge?.copyWith(
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
                          const SizedBox(height: 24),
                          Text(
                            'Color story',
                            style: textTheme.headlineSmall?.copyWith(
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
                          const SizedBox(height: 24),
                          Text(
                            'Styling tags',
                            style: textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 12),
                          if (product.styleTags.isNotEmpty)
                            _TagBlock(label: 'Style', tags: product.styleTags),
                          if (product.occasionTags.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            _TagBlock(
                                label: 'Occasion', tags: product.occasionTags),
                          ],
                        ],
                        if (shop != null) ...[
                          const SizedBox(height: 24),
                          _ShopSection(shop: shop),
                        ] else if (product.premiumShopDetailsRequired) ...[
                          const SizedBox(height: 24),
                          _PremiumShopHint(product: product),
                        ],
                        const SizedBox(height: 24),
                        _FeedbackCard(product: product),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SurfaceIconButton(
                    icon: Icons.arrow_back_ios_new_rounded,
                    onPressed: () => Navigator.of(context).maybePop(),
                  ),
                  const Spacer(),
                  Column(
                    children: [
                      SurfaceIconButton(
                        icon: Icons.favorite_border_rounded,
                        onPressed: null,
                      ),
                      const SizedBox(height: 10),
                      SurfaceIconButton(
                        icon: Icons.ios_share_rounded,
                        onPressed: null,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppColors.line),
            boxShadow: const [
              BoxShadow(
                color: Color(0x120E1420),
                blurRadius: 24,
                offset: Offset(0, 10),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatMoney(product.price),
                      style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Price',
                      style: textTheme.bodyLarge?.copyWith(
                        color: AppColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                flex: 2,
                child: MiroirButton(
                  label: 'Open Studio',
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
      height: 404,
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
                  Colors.black.withValues(alpha: 0.04),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.08),
                ],
              ),
            ),
          ),
          const Positioned(
            left: 0,
            right: 0,
            bottom: 18,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _DotIndicator(isActive: true),
                    _DotIndicator(),
                    _DotIndicator(),
                    _DotIndicator(),
                    _DotIndicator(),
                  ],
                ),
              ],
            ),
          ),
          Positioned(
            right: 18,
            bottom: 18,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.38),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Text(
                '1 / 6',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
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

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'FEATURED PIECE',
                style: textTheme.labelLarge?.copyWith(
                  color: AppColors.mutedSoft,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.4,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                product.name,
                style: textTheme.displaySmall?.copyWith(
                  fontSize: 31,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.8,
                  height: 1.0,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 14),
        Container(
          constraints: const BoxConstraints(minWidth: 150),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _formatMoney(product.price),
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
                textAlign: TextAlign.right,
              ),
              const SizedBox(height: 4),
              Text(
                'Curated item',
                style: textTheme.bodyLarge?.copyWith(
                  color: AppColors.muted,
                ),
              ),
            ],
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
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: iconColor ?? AppColors.muted),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
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
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 150, maxWidth: 220),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFEAECEF)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.mutedSoft,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontSize: 22,
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
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(20),
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
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Shop',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Seller details attached to this catalog item.',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.muted,
                ),
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: SizedBox(
                  width: 64,
                  height: 64,
                  child: shop.logoUrl.isNotEmpty
                      ? Image.network(
                          shop.logoUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _shopLogoFallback(),
                        )
                      : _shopLogoFallback(),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shop.name,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    if (shop.slug.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        '@${shop.slug}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.muted,
                            ),
                      ),
                    ],
                    if (shop.description.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        shop.description,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _shopLogoFallback() {
    return Container(
      color: AppColors.elevated,
      alignment: Alignment.center,
      child: const Icon(Icons.storefront_rounded, color: AppColors.ink),
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
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
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
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Shop details are Premium',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          const Text(
              'Upgrade to view shop name, contact details, and more trusted buying context.'),
          const SizedBox(height: 12),
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

class _FeedbackCard extends StatefulWidget {
  const _FeedbackCard({required this.product});

  final CatalogProduct product;

  @override
  State<_FeedbackCard> createState() => _FeedbackCardState();
}

class _FeedbackCardState extends State<_FeedbackCard> {
  final _service = CatalogService();
  final _commentController = TextEditingController();
  int _rating = 5;
  String _fitFeedback = 'not_sure';
  String _message = '';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final session = AppSessionScope.of(context);
    if (!session.isSignedIn) {
      Navigator.of(context).maybePop();
      session.openLogin();
      return;
    }

    setState(() {
      _isSubmitting = true;
      _message = '';
    });

    try {
      await _service.submitProductFeedback(
        token: session.authToken,
        productId: widget.product.id,
        rating: _rating,
        fitFeedback: _fitFeedback,
        comment: _commentController.text,
      );
      setState(() => _message = 'Thanks, your feedback was saved.');
    } catch (error) {
      setState(() => _message = error.toString());
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Review this product',
              style:
                  textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          Row(
            children: List.generate(5, (index) {
              final value = index + 1;
              return IconButton(
                onPressed: () => setState(() => _rating = value),
                icon: Icon(
                  value <= _rating
                      ? Icons.star_rounded
                      : Icons.star_outline_rounded,
                  color: AppColors.ink,
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: _fitFeedback,
            decoration: const InputDecoration(labelText: 'Fit feedback'),
            items: const [
              DropdownMenuItem(
                  value: 'true_to_size', child: Text('True to size')),
              DropdownMenuItem(value: 'runs_small', child: Text('Runs small')),
              DropdownMenuItem(value: 'runs_large', child: Text('Runs large')),
              DropdownMenuItem(value: 'not_sure', child: Text('Not sure')),
            ],
            onChanged: (value) =>
                setState(() => _fitFeedback = value ?? 'not_sure'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Comment'),
          ),
          if (_message.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(_message),
          ],
          const SizedBox(height: 12),
          MiroirButton(
            label: _isSubmitting ? 'Submitting...' : 'Submit feedback',
            onPressed: _isSubmitting ? null : _submit,
            icon: Icons.rate_review_outlined,
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
