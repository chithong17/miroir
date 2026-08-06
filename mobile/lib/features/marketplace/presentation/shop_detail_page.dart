import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../data/catalog_models.dart';
import '../data/catalog_service.dart';
import 'product_detail_page.dart';
import 'widgets/catalog_product_card.dart';

class ShopDetailPage extends StatefulWidget {
  const ShopDetailPage({super.key, required this.shop});

  final CatalogShop shop;

  @override
  State<ShopDetailPage> createState() => _ShopDetailPageState();
}

class _ShopDetailPageState extends State<ShopDetailPage> {
  final _catalogService = CatalogService();
  bool _isLoading = true;
  String _error = '';
  List<CatalogProduct> _products = [];

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    try {
      setState(() {
        _isLoading = true;
        _error = '';
      });
      final result = await _catalogService.listProducts(shopId: widget.shop.id, page: 1);
      setState(() {
        _products = result.products;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load shop products.';
        _isLoading = false;
      });
    }
  }

  void _openProduct(CatalogProduct product) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProductDetailPage(product: product),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final shop = widget.shop;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFBFC),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: const Color(0xFFFAFBFC),
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.ink, size: 20),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
          SliverToBoxAdapter(
            child: Container(
              color: const Color(0xFFFAFBFC),
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x10000000),
                                blurRadius: 10,
                                offset: Offset(0, 4),
                              ),
                            ],
                            image: shop.logoUrl.isNotEmpty
                                ? DecorationImage(
                                    image: NetworkImage(shop.logoUrl),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                          child: shop.logoUrl.isEmpty
                              ? const Icon(Icons.storefront_rounded, color: AppColors.muted, size: 32)
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 8),
                              Text(
                                shop.name,
                                style: textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.ink,
                                  height: 1.2,
                                ),
                              ),
                              if (shop.slug.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  '@${shop.slug}',
                                  style: textTheme.bodyMedium?.copyWith(
                                    color: AppColors.muted,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (shop.description.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        shop.description,
                        style: textTheme.bodyMedium?.copyWith(
                          color: AppColors.ink.withValues(alpha: 0.8),
                          height: 1.5,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    if (shop.contact.address.isNotEmpty)
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 16, color: AppColors.muted),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              shop.contact.address,
                              style: textTheme.bodySmall?.copyWith(color: AppColors.muted),
                            ),
                          ),
                        ],
                      ),
                    if (shop.contact.phone.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.phone_outlined, size: 16, color: AppColors.muted),
                          const SizedBox(width: 8),
                          Text(
                            shop.contact.phone,
                            style: textTheme.bodySmall?.copyWith(color: AppColors.muted),
                          ),
                        ],
                      ),
                    ],
                    if (shop.contact.email.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.email_outlined, size: 16, color: AppColors.muted),
                          const SizedBox(width: 8),
                          Text(
                            shop.contact.email,
                            style: textTheme.bodySmall?.copyWith(color: AppColors.muted),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 24),
                    const Divider(height: 1, color: AppColors.line),
                    const SizedBox(height: 24),
                    Text(
                      'All Products',
                      style: textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
          ),
          if (_isLoading)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: CircularProgressIndicator(color: AppColors.ink)),
              ),
            )
          else if (_error.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.muted),
                      const SizedBox(height: 16),
                      Text(_error, style: textTheme.bodyMedium?.copyWith(color: AppColors.muted)),
                      const SizedBox(height: 16),
                      TextButton(onPressed: _fetchProducts, child: const Text('Retry')),
                    ],
                  ),
                ),
              ),
            )
          else if (_products.isEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(Icons.inventory_2_outlined, size: 48, color: AppColors.muted),
                      const SizedBox(height: 16),
                      Text('No products available.', style: textTheme.bodyLarge?.copyWith(color: AppColors.ink)),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  mainAxisExtent: 304,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final product = _products[index];
                    return GestureDetector(
                      onTap: () => _openProduct(product),
                      child: CatalogProductCard(
                        product: product,
                        onTap: () => _openProduct(product),
                      ),
                    );
                  },
                  childCount: _products.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

