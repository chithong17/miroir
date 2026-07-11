import 'package:flutter/material.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../customer/data/customer_service.dart';
import '../../marketplace/data/catalog_models.dart';
import '../../marketplace/presentation/product_detail_page.dart';
import '../../marketplace/presentation/widgets/catalog_product_card.dart';

class FavoriteProductsPage extends StatefulWidget {
  const FavoriteProductsPage({super.key});

  @override
  State<FavoriteProductsPage> createState() => _FavoriteProductsPageState();
}

class _FavoriteProductsPageState extends State<FavoriteProductsPage> {
  final _customerService = CustomerService();
  bool _isLoading = true;
  String _error = '';
  List<CatalogProduct> _products = [];

  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _initialized = true;
      _fetchFavorites();
    }
  }

  Future<void> _fetchFavorites() async {
    final session = AppSessionScope.of(context);
    try {
      setState(() {
        _isLoading = true;
        _error = '';
      });
      if (session.authToken.isEmpty) {
        setState(() {
          _products = const [];
          _isLoading = false;
        });
        return;
      }
      final products = await _customerService.getFavoriteProducts(session.authToken);
      setState(() {
        _products = products;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load favorite products.';
        _isLoading = false;
      });
    }
  }

  void _openProduct(CatalogProduct product) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProductDetailPage(product: product),
      ),
    ).then((_) {
      // Re-fetch when returning, in case they unfavorited it
      _fetchFavorites();
    });
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      backgroundColor: const Color(0xFFFAFBFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFAFBFC),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.ink, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Saved Items',
          style: textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.ink),
      );
    }

    if (_error.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.muted),
            const SizedBox(height: 16),
            Text(
              _error,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.muted),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: _fetchFavorites,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_products.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.favorite_border_rounded, size: 48, color: AppColors.muted),
            const SizedBox(height: 16),
            Text(
              'No saved items yet.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.ink),
            ),
            const SizedBox(height: 8),
            Text(
              'Explore the shop and tap the heart\nicon to save your favorite products.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.muted),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.68,
      ),
      itemCount: _products.length,
      itemBuilder: (context, index) {
        final product = _products[index];
        return GestureDetector(
          onTap: () => _openProduct(product),
          child: CatalogProductCard(product: product),
        );
      },
    );
  }
}

