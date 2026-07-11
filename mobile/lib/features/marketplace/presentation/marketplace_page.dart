import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_pill.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../payments/presentation/premium_paywall_sheet.dart';
import '../../try_on/presentation/try_on_page.dart';
import '../data/catalog_models.dart';
import 'controllers/marketplace_controller.dart';
import 'product_detail_page.dart';

class MarketplacePage extends StatefulWidget {
  const MarketplacePage({super.key});

  @override
  State<MarketplacePage> createState() => _MarketplacePageState();
}

class _MarketplacePageState extends State<MarketplacePage> {
  final _controller = MarketplaceController();
  final _searchController = TextEditingController();
  final _categoryController = TextEditingController();
  final _minPriceController = TextEditingController();
  final _maxPriceController = TextEditingController();
  String _gender = '';
  bool _didLoad = false;
  bool _showAdvancedFilters = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_didLoad) {
      _didLoad = true;
      _controller.loadInitial(token: AppSessionScope.of(context).authToken);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _searchController.dispose();
    _categoryController.dispose();
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  Future<void> _applyFilters() async {
    await _controller.applyFilters(
      search: _searchController.text,
      category: _categoryController.text,
      gender: _gender,
      minPrice: _minPriceController.text,
      maxPrice: _maxPriceController.text,
      token: AppSessionScope.of(context).authToken,
    );
  }

  Future<void> _openProductDetail(CatalogProduct product) async {
    await _controller.openProduct(product,
        token: AppSessionScope.of(context).authToken);
    if (!mounted) {
      return;
    }

    final resolvedProduct = _controller.selectedProduct ?? product;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProductDetailPage(product: resolvedProduct),
      ),
    );
    _controller.closeProduct();
  }

  void _openTryOn(CatalogProduct product) {
    final session = AppSessionScope.of(context);
    if (!session.isSignedIn) {
      _showAuthPrompt();
      return;
    }
    if (session.isTryOnQuotaExhausted) {
      showPremiumPaywall(
        context,
        session: session,
        reason:
            'You have used all free try-on credits this month. Upgrade to keep using Studio.',
      );
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => TryOnPage(prefilledProduct: product)),
    );
  }

  void _showAuthPrompt() {
    final session = AppSessionScope.of(context);
    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Sign in required'),
          content: const Text(
            'Browse is available in guest mode, but save-your-profile flows and product try-on entry work best after login.',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                session.openLogin();
              },
              child: const Text('Login'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                session.openRegister();
              },
              child: const Text('Register'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Later'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 132),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Marketplace',
                    style: textTheme.headlineSmall,
                  ),
                ),
                GlassPill(
                  label: _controller.view == MarketplaceView.products
                      ? 'Products'
                      : 'Outfits',
                ),
              ],
            ),
            const SizedBox(height: 12),
            GlassSurface(
              radius: 24,
              blurSigma: 12,
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  SegmentedButton<MarketplaceView>(
                    segments: const [
                      ButtonSegment(
                        value: MarketplaceView.products,
                        label: Text('Products'),
                      ),
                      ButtonSegment(
                        value: MarketplaceView.outfits,
                        label: Text('Outfits'),
                      ),
                    ],
                    selected: {_controller.view},
                    onSelectionChanged: (selection) {
                      _controller.changeView(selection.first,
                          token: AppSessionScope.of(context).authToken);
                    },
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          textInputAction: TextInputAction.search,
                          onSubmitted: (_) => _applyFilters(),
                          decoration: const InputDecoration(
                            hintText: 'Search products',
                            prefixIcon: Icon(Icons.search_rounded),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      _FilterToggleButton(
                        isExpanded: _showAdvancedFilters,
                        onTap: () {
                          setState(() {
                            _showAdvancedFilters = !_showAdvancedFilters;
                          });
                        },
                      ),
                    ],
                  ),
                  AnimatedCrossFade(
                    duration: const Duration(milliseconds: 220),
                    crossFadeState: _showAdvancedFilters
                        ? CrossFadeState.showSecond
                        : CrossFadeState.showFirst,
                    firstChild: const SizedBox.shrink(),
                    secondChild: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Column(
                        children: [
                          if (_controller.view == MarketplaceView.products) ...[
                            TextField(
                              controller: _categoryController,
                              decoration: const InputDecoration(
                                hintText: 'Category',
                              ),
                            ),
                            const SizedBox(height: 10),
                          ],
                          DropdownButtonFormField<String>(
                            initialValue: _gender.isEmpty ? null : _gender,
                            decoration: const InputDecoration(
                              hintText: 'Gender',
                            ),
                            items: const [
                              DropdownMenuItem(
                                  value: 'female', child: Text('Female')),
                              DropdownMenuItem(
                                  value: 'male', child: Text('Male')),
                              DropdownMenuItem(
                                  value: 'unisex', child: Text('Unisex')),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _gender = value ?? '';
                              });
                            },
                          ),
                          if (_controller.view == MarketplaceView.products) ...[
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _minPriceController,
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                            decimal: true),
                                    decoration: const InputDecoration(
                                        hintText: 'Min price'),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: TextField(
                                    controller: _maxPriceController,
                                    keyboardType:
                                        const TextInputType.numberWithOptions(
                                            decimal: true),
                                    decoration: const InputDecoration(
                                        hintText: 'Max price'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: MiroirButton(
                              label: 'Apply filters',
                              onPressed: _controller.isLoading
                                  ? null
                                  : () => _applyFilters(),
                              icon: Icons.tune_rounded,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (_controller.errorMessage.isNotEmpty) ...[
              const SizedBox(height: 12),
              GlassSurface(
                radius: 22,
                color: AppColors.dangerSoft,
                borderColor: const Color(0xFFFFD1D1),
                padding: const EdgeInsets.all(14),
                child: Text(_controller.errorMessage),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Text(
                    _controller.view == MarketplaceView.products
                        ? 'All products'
                        : 'All outfits',
                    style: textTheme.titleLarge,
                  ),
                ),
                Text(
                  '${_controller.pagination.total} items',
                  style: textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_controller.isLoading)
              const Padding(
                padding: EdgeInsets.only(top: 30),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_controller.view == MarketplaceView.products)
              _ProductGrid(
                products: _controller.products,
                onDetail: _openProductDetail,
                onTryOn: _openTryOn,
              )
            else
              _OutfitGrid(
                outfits: _controller.outfits,
                onOpenProduct: _openProductDetail,
              ),
            const SizedBox(height: 14),
            if (_controller.pagination.totalPages > 1)
              Row(
                children: [
                  Expanded(
                    child: MiroirButton(
                      label: 'Previous',
                      onPressed: _controller.pagination.page <= 1 ||
                              _controller.isLoading
                          ? null
                          : () => _controller.previousPage(
                              token: AppSessionScope.of(context).authToken),
                      isSecondary: true,
                      icon: Icons.arrow_back_rounded,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${_controller.pagination.page}/${_controller.pagination.totalPages}',
                    style: textTheme.titleMedium,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: MiroirButton(
                      label: 'Next',
                      onPressed: _controller.pagination.page >=
                                  _controller.pagination.totalPages ||
                              _controller.isLoading
                          ? null
                          : () => _controller.nextPage(
                              token: AppSessionScope.of(context).authToken),
                      icon: Icons.arrow_forward_rounded,
                    ),
                  ),
                ],
              ),
          ],
        );
      },
    );
  }
}

class _FilterToggleButton extends StatelessWidget {
  const _FilterToggleButton({
    required this.isExpanded,
    required this.onTap,
  });

  final bool isExpanded;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.line),
          ),
          child: Icon(
            isExpanded ? Icons.close_rounded : Icons.tune_rounded,
            color: AppColors.ink,
          ),
        ),
      ),
    );
  }
}

class _ProductGrid extends StatelessWidget {
  const _ProductGrid({
    required this.products,
    required this.onDetail,
    required this.onTryOn,
  });

  final List<CatalogProduct> products;
  final ValueChanged<CatalogProduct> onDetail;
  final ValueChanged<CatalogProduct> onTryOn;

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return const GlassSurface(
        radius: 24,
        child: Text('No products found.'),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: products.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        mainAxisExtent: 330,
      ),
      itemBuilder: (context, index) {
        final product = products[index];
        final textTheme = Theme.of(context).textTheme;

        return Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          child: InkWell(
            borderRadius: BorderRadius.circular(24),
            onTap: () => onDetail(product),
            child: Ink(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                color: Colors.white,
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x100E1420),
                    blurRadius: 16,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: AspectRatio(
                        aspectRatio: 1.06,
                        child: product.imageUrl.isNotEmpty
                            ? Image.network(
                                product.imageUrl,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) =>
                                    Container(color: AppColors.elevated),
                              )
                            : Container(color: AppColors.elevated),
                      ),
                    ),
                    const SizedBox(height: 9),
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        height: 1.12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      product.shop?.name ?? 'Shop',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: textTheme.bodySmall?.copyWith(
                        color: AppColors.muted,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _formatMoney(product.price),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const Spacer(),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => onTryOn(product),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.ink,
                          foregroundColor: Colors.white,
                          minimumSize: const Size.fromHeight(36),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          side: BorderSide.none,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999),
                          ),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        icon: const Icon(Icons.checkroom_rounded, size: 16),
                        label: const Text('Studio'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _OutfitGrid extends StatelessWidget {
  const _OutfitGrid({
    required this.outfits,
    required this.onOpenProduct,
  });

  final List<CatalogOutfit> outfits;
  final ValueChanged<CatalogProduct> onOpenProduct;

  @override
  Widget build(BuildContext context) {
    if (outfits.isEmpty) {
      return const GlassSurface(
        radius: 24,
        child: Text('No outfit sets available yet.'),
      );
    }

    return Column(
      children: outfits.map((outfit) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: GlassSurface(
            radius: 24,
            blurSigma: 12,
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(outfit.title,
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 6),
                Text(
                  outfit.description.isEmpty
                      ? '${outfit.products.length} items'
                      : outfit.description,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 98,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: outfit.products.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (context, index) {
                      final product = outfit.products[index];
                      return GestureDetector(
                        onTap: () => onOpenProduct(product),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(18),
                          child: SizedBox(
                            width: 82,
                            child: product.imageUrl.isNotEmpty
                                ? Image.network(
                                    product.imageUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) =>
                                        Container(color: AppColors.elevated),
                                  )
                                : Container(color: AppColors.elevated),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
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

