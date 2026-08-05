import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_pill.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../marketplace/data/catalog_models.dart';
import '../../marketplace/presentation/controllers/marketplace_controller.dart';
import '../../marketplace/presentation/product_detail_page.dart';
import '../../marketplace/presentation/widgets/catalog_product_card.dart';

import '../../payments/presentation/premium_paywall_sheet.dart';
import '../../stylist/presentation/stylist_page.dart';
import '../../try_on/presentation/try_on_page.dart';

const _homeGreetingTitle = 'Hello';
const _homeWelcomeLabel = 'Welcome back to MIROIR';
const _homeAvatarLabel = 'G';

const _featuredTools = [
  _FeatureTool(
    title: 'AI Stylist',
    subtitle:
        'Describe a vibe and get 5 curated outfits grounded in your current catalog.',
    metric: '5 looks',
    imageUrl: 'assets/images/ai-stylist.png',
    destination: _MiniFeatureDestination.stylist,
  ),
  _FeatureTool(
    title: 'Virtual Try-On',
    subtitle: 'Upload your photo and preview the outfit composition instantly.',
    metric: 'Live preview',
    imageUrl: 'assets/images/f-try-on.png',
    destination: _MiniFeatureDestination.tryOn,
  ),
];

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _categories = const ['All', 'Casual', 'Party', 'Minimal', 'Street', 'Formal'];
  int _selectedCategory = 0;

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
    final cat = _selectedCategory == 0 
        ? _categoryController.text 
        : _categories[_selectedCategory];
        
    await _controller.applyFilters(
      search: _searchController.text,
      category: cat,
      gender: _gender,
      minPrice: _minPriceController.text,
      maxPrice: _maxPriceController.text,
      token: AppSessionScope.of(context).authToken,
    );
  }

  void _onCategorySelected(int index) {
    setState(() {
      _selectedCategory = index;
    });
    _applyFilters();
  }

  Future<void> _openProductDetail(CatalogProduct product) async {
    await _controller.openProduct(product,
        token: AppSessionScope.of(context).authToken);
    if (!mounted) return;

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

  void _openDestination(_MiniFeatureDestination destination) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => destination == _MiniFeatureDestination.tryOn
            ? const TryOnPage()
            : const StylistPage(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final session = AppSessionScope.of(context);
    final user = session.currentUser;
    
    final greetingTitle = user != null && user.name.isNotEmpty 
        ? 'Hello, ${user.name.split(' ').first}' 
        : _homeGreetingTitle;
    final avatarLabel = user != null && user.name.isNotEmpty 
        ? user.name[0].toUpperCase() 
        : _homeAvatarLabel;
    final avatarUrl = user?.profile.modelImageUrl;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 132),
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(greetingTitle, style: textTheme.headlineSmall),
                      const SizedBox(height: 5),
                      Text(_homeWelcomeLabel, style: textTheme.bodyMedium),
                    ],
                  ),
                ),
                _AvatarBubble(label: avatarLabel, imageUrl: avatarUrl),
              ],
            ),
            const SizedBox(height: 18),

            // Search and Filter Bar
            GlassSurface(
              radius: 24,
              blurSigma: 12,
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
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
                          if (_controller.view == MarketplaceView.products && _selectedCategory == 0) ...[
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
            const SizedBox(height: 24),

            // AI Tools Swipe
            Row(
              children: [
                Expanded(
                  child: Text('Featured AI tools', style: textTheme.titleLarge),
                ),
                Text('Swipe', style: textTheme.bodySmall),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 292,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                clipBehavior: Clip.none,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _featuredTools.length,
                separatorBuilder: (_, __) => const SizedBox(width: 14),
                itemBuilder: (context, index) {
                  final tool = _featuredTools[index];
                  return _MiniFeatureCard(
                    tool: tool,
                    onTap: () => _openDestination(tool.destination),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),

            // Shopping Promo
            _ShoppingPromoCard(
              onTap: () {},
            ),
            const SizedBox(height: 24),

            // Categories Header
            Row(
              children: [
                Expanded(
                  child: Text('Explore products', style: textTheme.titleLarge),
                ),
                Text('Swipe', style: textTheme.bodySmall),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemBuilder: (context, index) {
                  final selected = index == _selectedCategory;
                  return ChoiceChip(
                    label: Text(_categories[index]),
                    selected: selected,
                    onSelected: (_) => _onCategorySelected(index),
                  );
                },
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemCount: _categories.length,
              ),
            ),
            const SizedBox(height: 24),

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

            Row(
              children: [
                Expanded(
                  child: Text(
                    'All products',
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

// -----------------------------------------------------------------------------
// Component Widgets Below
// -----------------------------------------------------------------------------

class _AvatarBubble extends StatelessWidget {
  const _AvatarBubble({required this.label, this.imageUrl});
  final String label;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      radius: 999,
      blurSigma: 14,
      padding: EdgeInsets.zero,
      shadowOpacity: 0.24,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          image: imageUrl != null && imageUrl!.isNotEmpty
              ? DecorationImage(
                  image: NetworkImage(imageUrl!),
                  fit: BoxFit.cover,
                )
              : null,
        ),
        child: imageUrl == null || imageUrl!.isEmpty
            ? Center(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              )
            : null,
      ),
    );
  }
}

enum _MiniFeatureDestination { stylist, tryOn }

class _MiniFeatureCard extends StatelessWidget {
  const _MiniFeatureCard({
    required this.tool,
    required this.onTap,
  });

  final _FeatureTool tool;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(30),
      onTap: onTap,
      child: SizedBox(
        width: 244,
        child: GlassSurface(
          radius: 30,
          blurSigma: 14,
          shadowOpacity: 0.24,
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: tool.imageUrl.startsWith('http')
                    ? Image.network(
                        tool.imageUrl,
                        height: 118,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            Container(height: 118, color: AppColors.elevated),
                      )
                    : Image.asset(
                        tool.imageUrl,
                        height: 118,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            Container(height: 118, color: AppColors.elevated),
                      ),
              ),
              const SizedBox(height: 14),
              Text(
                tool.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 6),
              Expanded(
                child: Text(
                  tool.subtitle,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  GlassPill(label: tool.metric),
                  const Spacer(),
                  GlassSurface(
                    radius: 999,
                    blurSigma: 14,
                    padding: EdgeInsets.zero,
                    shadowOpacity: 0.18,
                    child: const SizedBox(
                      width: 40,
                      height: 40,
                      child: Icon(
                        Icons.arrow_forward_rounded,
                        color: AppColors.ink,
                        size: 18,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureTool {
  const _FeatureTool({
    required this.title,
    required this.subtitle,
    required this.metric,
    required this.imageUrl,
    required this.destination,
  });

  final String title;
  final String subtitle;
  final String metric;
  final String imageUrl;
  final _MiniFeatureDestination destination;
}

class _ShoppingPromoCard extends StatelessWidget {
  const _ShoppingPromoCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(34),
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(34),
        child: SizedBox(
          height: 180,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                'assets/images/shop-bg.png',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(color: AppColors.elevated),
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      Colors.black.withValues(alpha: 0.8),
                      Colors.black.withValues(alpha: 0.2),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Shop the Latest',
                      style: Theme.of(context)
                          .textTheme
                          .headlineSmall
                          ?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Explore new arrivals and trending pieces.',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: Colors.white70),
                    ),
                    const SizedBox(height: 16),
                    const GlassPill(
                      label: 'Explore Marketplace',
                      icon: Icons.arrow_forward_rounded,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
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
