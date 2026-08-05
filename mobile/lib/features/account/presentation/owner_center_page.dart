import 'package:flutter/material.dart';
import 'dart:math' as math;

import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/app/app_session_controller.dart';
import '../../../shared/models/local_image_data.dart';
import '../../../core/app/app_session_scope.dart';
import '../../../core/network/api_error.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_pill.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/section_card.dart';
import '../../commerce/presentation/shop_commerce_page.dart';
import '../../payments/data/payment_models.dart';
import '../../payments/data/payment_service.dart';
import '../data/account_models.dart';
import '../data/owner_shop_models.dart';
import 'controllers/shop_auth_controller.dart';
import 'controllers/shop_dashboard_controller.dart';

class OwnerCenterPage extends StatefulWidget {
  const OwnerCenterPage({super.key});

  @override
  State<OwnerCenterPage> createState() => _OwnerCenterPageState();
}

class _OwnerCenterPageState extends State<OwnerCenterPage> {
  ShopAuthController? _auth;
  ShopDashboardController? _dashboard;
  AppSessionController? _session;
  var _sectionIndex = 0;
  var _analyticsIndex = 0;
  var _analyticsRange = '30d';
  var _loaded = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final session = AppSessionScope.of(context);
    if (_session == session) return;
    _session = session;
    _auth?.dispose();
    _dashboard?.dispose();
    _auth = ShopAuthController(sessionController: session);
    _dashboard = ShopDashboardController(sessionController: session);
  }

  @override
  void dispose() {
    _auth?.dispose();
    _dashboard?.dispose();
    super.dispose();
  }

  void _loadOwnerData() {
    final session = _session;
    final dashboard = _dashboard;
    if (_loaded || session == null || dashboard == null) return;
    if (!session.hasShopOwnerSession) return;
    _loaded = true;
    dashboard.loadDashboard();
  }

  @override
  Widget build(BuildContext context) {
    final session = _session ?? AppSessionScope.of(context);
    _loadOwnerData();

    return Scaffold(
      backgroundColor: const Color(0xFFFAFBFC),
      body: SafeArea(
        child: ListenableBuilder(
          listenable: session,
          builder: (context, _) {
            if (!session.hasShopOwnerSession) {
              _loaded = false;
              return _OwnerAuthPanel(controller: _auth!);
            }

            final dashboard = _dashboard!;
            return ListenableBuilder(
              listenable: dashboard,
              builder: (context, _) => CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                      child: _Header(
                        title: 'Owner Center',
                        subtitle:
                            session.currentShopOwner?.name ?? 'Shop owner',
                        isPremium: session.isShopOwnerPremium,
                      ),
                    ),
                  ),
                  SliverPersistentHeader(
                    pinned: true,
                    delegate: _TabsHeader(
                      selectedIndex: _sectionIndex,
                      labels: const [
                        'Overview',
                        'Products',
                        'Analytics',
                        'Profile'
                      ],
                      onChanged: (index) {
                        setState(() => _sectionIndex = index);
                        if (index == 2 && dashboard.isPremium) {
                          dashboard.loadAnalytics(range: _analyticsRange);
                        }
                      },
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        if (dashboard.state == ShopDashboardState.loading)
                          const _LoadingCard('Loading owner workspace...')
                        else if (dashboard.state == ShopDashboardState.error)
                          _MessageCard(
                            title: 'Could not load owner data',
                            message: dashboard.errorMessage,
                            actionLabel: 'Retry',
                            onAction: dashboard.loadDashboard,
                          )
                        else
                          _section(session, dashboard),
                      ]),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _section(
      AppSessionController session, ShopDashboardController dashboard) {
    if (_sectionIndex == 1) {
      return _ProductsPanel(
        dashboard: dashboard,
        onAdd: () => _openProductForm(dashboard),
        onEdit: (product) => _openProductForm(dashboard, product: product),
        onUpgrade: () => _showOwnerPaywall(session),
      );
    }
    if (_sectionIndex == 2) {
      return _AnalyticsPanel(
        dashboard: dashboard,
        selectedIndex: _analyticsIndex,
        onChanged: (index) => setState(() => _analyticsIndex = index),
        range: _analyticsRange,
        onRangeChanged: (range) {
          setState(() => _analyticsRange = range);
          dashboard.loadAnalytics(range: range);
        },
        onLoad: () => dashboard.loadAnalytics(range: _analyticsRange),
        onUpgrade: () => _showOwnerPaywall(session),
      );
    }
    if (_sectionIndex == 3) {
      return _ProfilePanel(
        session: session,
        dashboard: dashboard,
        onEditShop: () => _openShopForm(dashboard),
        onUpgrade: () => _showOwnerPaywall(session),
      );
    }
    return _OverviewPanel(
      session: session,
      dashboard: dashboard,
      onEditShop: () => _openShopForm(dashboard),
      onUpgrade: () => _showOwnerPaywall(session),
    );
  }

  Future<void> _openShopForm(ShopDashboardController dashboard) async {
    final shop = dashboard.shop;
    final name = TextEditingController(text: shop?.name ?? '');
    final slug = TextEditingController(text: shop?.slug ?? '');
    final description = TextEditingController(text: shop?.description ?? '');

    LocalImageData? logoImage;
    LocalImageData? coverImage;
    final picker = ImagePicker();

    await _showOwnerSheet(
      title: shop == null ? 'Create shop' : 'Edit shop',
      child: StatefulBuilder(
        builder: (context, setState) {
          return Column(
            children: [
              _ImageUploadField(
                label: 'Shop Logo',
                currentUrl: shop?.logoUrl ?? '',
                localData: logoImage,
                onPick: () async {
                  final file =
                      await picker.pickImage(source: ImageSource.gallery);
                  if (file != null) {
                    final bytes = await file.readAsBytes();
                    setState(() => logoImage = LocalImageData(
                          name: file.name,
                          bytes: bytes,
                          mimeType: file.mimeType,
                        ));
                  }
                },
              ),
              _ImageUploadField(
                label: 'Shop Cover',
                currentUrl: shop?.coverUrl ?? '',
                localData: coverImage,
                onPick: () async {
                  final file =
                      await picker.pickImage(source: ImageSource.gallery);
                  if (file != null) {
                    final bytes = await file.readAsBytes();
                    setState(() => coverImage = LocalImageData(
                          name: file.name,
                          bytes: bytes,
                          mimeType: file.mimeType,
                        ));
                  }
                },
              ),
              _Field(controller: name, label: 'Shop name'),
              _Field(controller: slug, label: 'Slug'),
              _Field(controller: description, label: 'Description', maxLines: 3),
              const SizedBox(height: 12),
              MiroirButton(
                label: dashboard.isSavingShop ? 'Saving...' : 'Save shop',
                onPressed: dashboard.isSavingShop
                    ? null
                    : () async {
                        await dashboard.saveShop(
                          name: name.text,
                          slug: slug.text,
                          description: description.text,
                          logoUrl: shop?.logoUrl ?? '',
                          coverUrl: shop?.coverUrl ?? '',
                          logoImage: logoImage,
                          coverImage: coverImage,
                        );
                        if (mounted) Navigator.of(context).pop();
                      },
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _openProductForm(
    ShopDashboardController dashboard, {
    ShopProduct? product,
  }) async {
    if (!dashboard.isPremium) {
      await _showOwnerPaywall(_session!);
      return;
    }

    final draft = product == null
        ? const ShopProductDraft(
            name: '',
            category: '',
            description: '',
            priceText: '',
            gender: 'unisex',
            availability: 'in_stock',
            status: 'draft',
            colorsText: '',
            sizesText: 'S, M, L',
            styleTagsText: '',
            occasionTagsText: '',
            material: '',
            fitType: '',
          )
        : ShopProductDraft.fromProduct(product);

    final name = TextEditingController(text: draft.name);
    final category = TextEditingController(text: draft.category);
    final description = TextEditingController(text: draft.description);
    final price = TextEditingController(text: draft.priceText);
    final gender = TextEditingController(text: draft.gender);
    final availability = TextEditingController(text: draft.availability);
    final status = TextEditingController(text: draft.status);
    final sizes = TextEditingController(text: draft.sizesText);
    final colors = TextEditingController(text: draft.colorsText);
    final styleTags = TextEditingController(text: draft.styleTagsText);
    final occasionTags = TextEditingController(text: draft.occasionTagsText);
    final material = TextEditingController(text: draft.material);
    final fitType = TextEditingController(text: draft.fitType);
    
    LocalImageData? productImage;
    final picker = ImagePicker();

    await _showOwnerSheet(
      title: product == null ? 'Create product' : 'Edit product',
      child: StatefulBuilder(
        builder: (context, setState) {
          return Column(
            children: [
              _ImageUploadField(
                label: 'Product Image',
                currentUrl: product?.imageUrl ?? '',
                localData: productImage,
                onPick: () async {
                  final file = await picker.pickImage(source: ImageSource.gallery);
                  if (file != null) {
                    final bytes = await file.readAsBytes();
                    setState(() => productImage = LocalImageData(
                          name: file.name,
                          bytes: bytes,
                          mimeType: file.mimeType,
                        ));
                  }
                },
              ),
              _Field(controller: name, label: 'Name'),
              _Field(controller: category, label: 'Category'),
              _Field(controller: description, label: 'Description', maxLines: 3),
              _Field(controller: price, label: 'Price'),
              Row(
                children: [
                  Expanded(child: _Field(controller: gender, label: 'Gender')),
                  const SizedBox(width: 10),
                  Expanded(child: _Field(controller: status, label: 'Status')),
                ],
              ),
              _Field(controller: availability, label: 'Availability'),
              _Field(controller: sizes, label: 'Sizes'),
              _Field(controller: colors, label: 'Colors'),
              _Field(controller: styleTags, label: 'Style tags'),
              _Field(controller: occasionTags, label: 'Occasion tags'),
              Row(
                children: [
                  Expanded(child: _Field(controller: material, label: 'Material')),
                  const SizedBox(width: 10),
                  Expanded(child: _Field(controller: fitType, label: 'Fit')),
                ],
              ),
              const SizedBox(height: 12),
              MiroirButton(
                label: dashboard.isSavingProduct ? 'Saving...' : 'Save product',
                onPressed: dashboard.isSavingProduct
                    ? null
                    : () async {
                        final parsedPrice = double.tryParse(price.text.trim());
                        if (parsedPrice == null) return;
                        await dashboard.saveProduct(
                          productId: product?.id,
                          draft: ShopProductDraft(
                            name: name.text,
                            category: category.text,
                            description: description.text,
                            priceText: parsedPrice.toStringAsFixed(0),
                            gender: gender.text,
                            availability: availability.text,
                            status: status.text,
                            colorsText: colors.text,
                            sizesText: sizes.text,
                            styleTagsText: styleTags.text,
                            occasionTagsText: occasionTags.text,
                            material: material.text,
                            fitType: fitType.text,
                          ),
                          localImage: productImage,
                          existingImageUrl: product?.imageUrl ?? '',
                          existingImagePublicId: product?.imagePublicId ?? '',
                        );
                        if (mounted) Navigator.of(context).pop();
                      },
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _showOwnerPaywall(AppSessionController session) async {
    await _showOwnerSheet(
      title: 'Upgrade Shop Premium',
      child: _OwnerPremiumPanel(session: session),
    );
  }

  Future<void> _showOwnerSheet({
    required String title,
    required Widget child,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.86,
        minChildSize: 0.45,
        maxChildSize: 0.96,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFFFAFBFC),
            borderRadius: BorderRadius.vertical(top: Radius.circular(34)),
          ),
          child: ListView(
            controller: scrollController,
            padding: EdgeInsets.fromLTRB(
              20,
              16,
              20,
              28 + MediaQuery.of(context).viewInsets.bottom,
            ),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: Theme.of(context)
                          .textTheme
                          .headlineSmall
                          ?.copyWith(fontWeight: FontWeight.w900),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _OwnerAuthPanel extends StatelessWidget {
  const _OwnerAuthPanel({required this.controller});
  final ShopAuthController controller;

  @override
  Widget build(BuildContext context) {
    final name = TextEditingController();
    final email = TextEditingController();
    final password = TextEditingController();

    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) => ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
        children: [
          _Header(title: 'Owner Center', subtitle: 'Shop tools on mobile'),
          const SizedBox(height: 18),
          GlassSurface(
            radius: 32,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  controller.mode == ShopAuthMode.login
                      ? 'Login as shop owner'
                      : 'Register shop owner',
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Manage shop profile, products, analytics, and premium tools.',
                  style: TextStyle(color: AppColors.muted, height: 1.4),
                ),
                const SizedBox(height: 18),
                _ModeSwitch(
                  selectedIndex: controller.mode == ShopAuthMode.login ? 0 : 1,
                  labels: const ['Login', 'Register'],
                  onChanged: (index) => controller.setMode(
                    index == 0 ? ShopAuthMode.login : ShopAuthMode.register,
                  ),
                ),
                const SizedBox(height: 16),
                if (controller.mode == ShopAuthMode.register)
                  _Field(controller: name, label: 'Name'),
                _Field(controller: email, label: 'Email'),
                _Field(
                  controller: password,
                  label: 'Password',
                  obscureText: true,
                ),
                if (controller.errorMessage.isNotEmpty)
                  _InlineError(controller.errorMessage),
                if (controller.statusMessage.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Text(
                      controller.statusMessage,
                      style: const TextStyle(color: AppColors.muted),
                    ),
                  ),
                MiroirButton(
                  label: controller.isSubmitting
                      ? 'Please wait...'
                      : controller.mode == ShopAuthMode.login
                          ? 'Login'
                          : 'Register',
                  onPressed: controller.isSubmitting
                      ? null
                      : () => controller.submit(
                            name: name.text,
                            email: email.text,
                            password: password.text,
                          ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OverviewPanel extends StatelessWidget {
  const _OverviewPanel({
    required this.session,
    required this.dashboard,
    required this.onEditShop,
    required this.onUpgrade,
  });

  final AppSessionController session;
  final ShopDashboardController dashboard;
  final VoidCallback onEditShop;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    final shop = dashboard.shop;
    return Column(
      children: [
        _OwnerSubscriptionCard(session: session, onUpgrade: onUpgrade),
        const SizedBox(height: 14),
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                shop?.name ?? 'No shop profile yet',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              Text(
                shop?.description.isNotEmpty == true
                    ? shop!.description
                    : 'Create your shop profile before publishing products.',
                style: const TextStyle(color: AppColors.muted),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _StatTile(
                      label: 'Products',
                      value: '${dashboard.products.length}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatTile(
                      label: 'Shop',
                      value: shop?.status ?? 'setup',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              MiroirButton(
                label: shop == null ? 'Create Shop' : 'Edit Shop',
                icon: Icons.storefront_rounded,
                onPressed: onEditShop,
              ),
            ],
          ),
        ),
        if (dashboard.errorMessage.isNotEmpty) ...[
          const SizedBox(height: 12),
          _InlineError(dashboard.errorMessage),
        ],
      ],
    );
  }
}

class _ProductsPanel extends StatelessWidget {
  const _ProductsPanel({
    required this.dashboard,
    required this.onAdd,
    required this.onEdit,
    required this.onUpgrade,
  });

  final ShopDashboardController dashboard;
  final VoidCallback onAdd;
  final ValueChanged<ShopProduct> onEdit;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Products',
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w900),
              ),
            ),
            FilledButton.icon(
              onPressed: dashboard.isPremium ? onAdd : onUpgrade,
              icon: const Icon(Icons.add_rounded),
              label: Text(dashboard.isPremium ? 'Add' : 'Upgrade'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (!dashboard.isPremium)
          _PremiumGate(
            title: 'Premium required for product tools',
            message:
                'Upgrade to create, edit, publish, archive, and restore products.',
            onUpgrade: onUpgrade,
          ),
        if (dashboard.products.isEmpty)
          const _MessageCard(
            title: 'No products yet',
            message: 'Create your first product once your shop is ready.',
          )
        else
          ...dashboard.products.map(
            (product) => _OwnerProductCard(
              product: product,
              enabled: dashboard.isPremium,
              onEdit: () => onEdit(product),
              onArchive: () => dashboard.archiveProduct(product.id),
              onRestore: () => dashboard.restoreProduct(product.id),
              onDelete: () => dashboard.deleteProduct(product.id),
              onUpgrade: onUpgrade,
            ),
          ),
      ],
    );
  }
}

class _AnalyticsPanel extends StatelessWidget {
  const _AnalyticsPanel({
    required this.dashboard,
    required this.selectedIndex,
    required this.onChanged,
    required this.range,
    required this.onRangeChanged,
    required this.onLoad,
    required this.onUpgrade,
  });

  final ShopDashboardController dashboard;
  final int selectedIndex;
  final ValueChanged<int> onChanged;
  final String range;
  final ValueChanged<String> onRangeChanged;
  final VoidCallback onLoad;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    if (!dashboard.isPremium) {
      return _PremiumGate(
        title: 'Analytics is Premium',
        message: 'Unlock shop performance and customer insight reports.',
        onUpgrade: onUpgrade,
      );
    }

    final data = selectedIndex == 0 ? dashboard.analytics : dashboard.insights;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Analytics',
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w900),
              ),
            ),
            IconButton.filledTonal(
              onPressed: onLoad,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _ModeSwitch(
          selectedIndex: selectedIndex,
          labels: const ['Performance', 'Customer Insights'],
          onChanged: onChanged,
        ),
        const SizedBox(height: 12),
        _RangeSelector(
          value: range,
          onChanged: onRangeChanged,
        ),
        const SizedBox(height: 14),
        if (dashboard.isLoadingAnalytics)
          const _LoadingCard('Loading analytics...')
        else if (data == null)
          _MessageCard(
            title: 'Load analytics',
            message: 'Tap refresh to load the latest owner analytics.',
            actionLabel: 'Load now',
            onAction: onLoad,
          )
        else if (selectedIndex == 0)
          _PerformanceAnalyticsView(data: data, commerce: dashboard.commerceDashboard)
        else
          _CustomerInsightsView(data: data),
      ],
    );
  }
}

class _ProfilePanel extends StatelessWidget {
  const _ProfilePanel({
    required this.session,
    required this.dashboard,
    required this.onEditShop,
    required this.onUpgrade,
  });

  final AppSessionController session;
  final ShopDashboardController dashboard;
  final VoidCallback onEditShop;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    final owner = session.currentShopOwner;
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            owner?.name ?? 'Shop owner',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          Text(owner?.email ?? '',
              style: const TextStyle(color: AppColors.muted)),
          const SizedBox(height: 14),
          GlassPill(
            label: session.isShopOwnerPremium ? 'Shop Premium' : 'Free owner',
            icon: session.isShopOwnerPremium
                ? Icons.workspace_premium_rounded
                : Icons.lock_open_rounded,
          ),
          const SizedBox(height: 18),
          MiroirButton(
            label: dashboard.shop == null
                ? 'Create Shop Profile'
                : 'Edit Shop Profile',
            icon: Icons.storefront_rounded,
            onPressed: onEditShop,
          ),
          if (!session.isShopOwnerPremium) ...[
            const SizedBox(height: 10),
            MiroirButton(
              label: 'Upgrade Shop Premium',
              icon: Icons.workspace_premium_rounded,
              isSecondary: true,
              onPressed: onUpgrade,
            ),
          ],
          const SizedBox(height: 10),
          MiroirButton(
            label: 'Orders and alerts',
            icon: Icons.receipt_long_outlined,
            isSecondary: true,
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ShopCommercePage())),
          ),
          const SizedBox(height: 10),
          MiroirButton(
            label: 'Logout Owner',
            icon: Icons.logout_rounded,
            isSecondary: true,
            onPressed: session.logoutShopOwner,
          ),
        ],
      ),
    );
  }
}

class _OwnerPremiumPanel extends StatefulWidget {
  const _OwnerPremiumPanel({required this.session});
  final AppSessionController session;

  @override
  State<_OwnerPremiumPanel> createState() => _OwnerPremiumPanelState();
}

class _OwnerPremiumPanelState extends State<_OwnerPremiumPanel> {
  final _service = PaymentService();
  PaymentPlan? _plan;
  String _message = '';
  bool _loading = true;
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    try {
      final result = await _service.getPlans();
      PaymentPlan? found;
      for (final plan in result.plans) {
        if (plan.code == 'SHOP_OWNER_MONTHLY') found = plan;
      }
      for (final plan in result.plans) {
        found ??= plan.accountType == 'shop_owner' ? plan : null;
      }
      setState(() {
        _plan = found;
        _message =
            found == null ? 'Shop owner premium plan was not found.' : '';
      });
    } catch (error) {
      setState(() => _message = ApiError.from(error).message);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _pay() async {
    final plan = _plan;
    if (plan == null) return;
    setState(() {
      _creating = true;
      _message = '';
    });
    try {
      final result = await _service.createPayment(
        token: widget.session.shopOwnerToken,
        planCode: plan.code,
      );
      if (result.checkoutUrl.isEmpty) {
        setState(() => _message = 'Payment checkout URL is missing.');
        return;
      }
      await launchUrl(
        Uri.parse(result.checkoutUrl),
        mode: LaunchMode.externalApplication,
      );
    } catch (error) {
      setState(() => _message = ApiError.from(error).message);
    } finally {
      setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = _plan;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Premium unlocks product management, analytics, and customer insights.',
          style: TextStyle(color: AppColors.muted, height: 1.4),
        ),
        const SizedBox(height: 16),
        if (_loading)
          const _LoadingCard('Loading plan...')
        else if (plan != null)
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  plan.name,
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 6),
                Text(
                  '${_formatMoney(plan.price)} / ${plan.durationDays} days',
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 12),
                ...plan.features.take(4).map(
                      (feature) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.check_circle_rounded,
                              color: Colors.green,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Expanded(child: Text(feature)),
                          ],
                        ),
                      ),
                    ),
              ],
            ),
          ),
        if (_message.isNotEmpty) ...[
          const SizedBox(height: 12),
          _InlineError(_message),
        ],
        const SizedBox(height: 16),
        MiroirButton(
          label: _creating ? 'Opening PayOS...' : 'Pay with PayOS',
          icon: Icons.credit_card_rounded,
          onPressed: _creating || plan == null ? null : _pay,
        ),
        const SizedBox(height: 10),
        MiroirButton(
          label: _creating ? 'Refreshing...' : 'I have completed payment',
          icon: Icons.refresh_rounded,
          isSecondary: true,
          onPressed: _creating ? null : () async {
            setState(() {
              _creating = true;
              _message = '';
            });
            await widget.session.refreshShopOwnerSubscription();
            if (mounted) {
              setState(() => _creating = false);
              if (widget.session.isShopOwnerPremium) {
                Navigator.of(context).maybePop();
              } else {
                setState(() => _message = 'Your payment has not been processed yet. Please try again in a moment.');
              }
            }
          },
        ),
      ],
    );
  }
}

class _OwnerProductCard extends StatelessWidget {
  const _OwnerProductCard({
    required this.product,
    required this.enabled,
    required this.onEdit,
    required this.onArchive,
    required this.onRestore,
    required this.onDelete,
    required this.onUpgrade,
  });

  final ShopProduct product;
  final bool enabled;
  final VoidCallback onEdit;
  final VoidCallback onArchive;
  final VoidCallback onRestore;
  final VoidCallback onDelete;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    final archived = product.status == 'archived';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SectionCard(
        child: Column(
          children: [
            Row(
              children: [
                _ProductThumb(url: product.imageUrl),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        _formatMoney(product.price),
                        style: const TextStyle(color: AppColors.muted),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          GlassPill(
                            label: product.status,
                            icon: Icons.inventory_2_outlined,
                          ),
                          if (product.embeddingStale)
                            const GlassPill(
                              label: 'needs embed',
                              icon: Icons.auto_awesome_rounded,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: enabled ? onEdit : onUpgrade,
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: enabled
                        ? (archived ? onRestore : onArchive)
                        : onUpgrade,
                    icon: Icon(
                      archived ? Icons.restore_rounded : Icons.archive_outlined,
                    ),
                    label: Text(archived ? 'Restore' : 'Archive'),
                  ),
                ),
                IconButton.filledTonal(
                  onPressed: enabled ? onDelete : onUpgrade,
                  icon: const Icon(Icons.delete_outline_rounded),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnerSubscriptionCard extends StatelessWidget {
  const _OwnerSubscriptionCard(
      {required this.session, required this.onUpgrade});
  final AppSessionController session;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    final sub =
        session.currentShopOwner?.subscription ?? ShopOwnerSubscription.free;
    return GlassSurface(
      radius: 28,
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                sub.isPremium
                    ? Icons.workspace_premium_rounded
                    : Icons.lock_open_rounded,
                color: sub.isPremium ? Colors.amber.shade700 : AppColors.ink,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  sub.isPremium
                      ? 'Shop Premium active'
                      : 'Free owner workspace',
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            sub.isPremium
                ? 'Product tools, analytics, and insights are unlocked.'
                : 'Upgrade to manage products and view analytics from mobile.',
            style: const TextStyle(color: AppColors.muted),
          ),
          if (!sub.isPremium) ...[
            const SizedBox(height: 16),
            MiroirButton(
              label: 'Upgrade Shop Premium',
              icon: Icons.workspace_premium_rounded,
              onPressed: onUpgrade,
            ),
          ],
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.title, required this.subtitle, this.isPremium});
  final String title;
  final String subtitle;
  final bool? isPremium;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton.filledTonal(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(fontWeight: FontWeight.w900),
              ),
              Text(subtitle, style: const TextStyle(color: AppColors.muted)),
            ],
          ),
        ),
        if (isPremium != null)
          GlassPill(
            label: isPremium! ? 'Premium' : 'Free',
            icon: isPremium!
                ? Icons.workspace_premium_rounded
                : Icons.lock_open_rounded,
          ),
      ],
    );
  }
}

class _TabsHeader extends SliverPersistentHeaderDelegate {
  _TabsHeader({
    required this.selectedIndex,
    required this.labels,
    required this.onChanged,
  });

  final int selectedIndex;
  final List<String> labels;
  final ValueChanged<int> onChanged;

  @override
  double get minExtent => 72;
  @override
  double get maxExtent => 72;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: const Color(0xFFFAFBFC).withValues(alpha: 0.96),
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: labels.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) => ChoiceChip(
          label: Text(labels[index]),
          selected: selectedIndex == index,
          onSelected: (_) => onChanged(index),
          selectedColor: AppColors.ink,
          backgroundColor: Colors.white,
          side: const BorderSide(color: AppColors.line),
          labelStyle: TextStyle(
            color: selectedIndex == index ? Colors.white : AppColors.ink,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _TabsHeader oldDelegate) {
    return oldDelegate.selectedIndex != selectedIndex;
  }
}

class _ModeSwitch extends StatelessWidget {
  const _ModeSwitch({
    required this.selectedIndex,
    required this.labels,
    required this.onChanged,
  });

  final int selectedIndex;
  final List<String> labels;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var index = 0; index < labels.length; index++) ...[
          Expanded(
            child: GestureDetector(
              onTap: () => onChanged(index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(
                  color: selectedIndex == index ? AppColors.ink : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.line),
                ),
                child: Text(
                  labels[index],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color:
                        selectedIndex == index ? Colors.white : AppColors.ink,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ),
          if (index < labels.length - 1) const SizedBox(width: 10),
        ],
      ],
    );
  }
}

class _ImageUploadField extends StatelessWidget {
  const _ImageUploadField({
    required this.label,
    required this.currentUrl,
    required this.localData,
    required this.onPick,
  });

  final String label;
  final String currentUrl;
  final LocalImageData? localData;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    Widget imagePreview;
    if (localData != null) {
      imagePreview = Image.memory(
        localData!.bytes,
        fit: BoxFit.cover,
      );
    } else if (currentUrl.isNotEmpty) {
      imagePreview = Image.network(
        currentUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => const Center(
          child: Icon(Icons.broken_image_rounded, color: AppColors.muted),
        ),
      );
    } else {
      imagePreview = const Center(
        child: Icon(Icons.add_photo_alternate_rounded,
            color: AppColors.muted, size: 32),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 6),
            child: Text(
              label,
              style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: AppColors.ink),
            ),
          ),
          GestureDetector(
            onTap: onPick,
            child: Container(
              height: 140,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.line),
              ),
              clipBehavior: Clip.hardEdge,
              child: imagePreview,
            ),
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.label,
    this.maxLines = 1,
    this.obscureText = false,
  });

  final TextEditingController controller;
  final String label;
  final int maxLines;
  final bool obscureText;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: obscureText ? 1 : maxLines,
        obscureText: obscureText,
        decoration: InputDecoration(
          labelText: label,
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(18),
            borderSide: const BorderSide(color: AppColors.line),
          ),
        ),
      ),
    );
  }
}

class _PremiumGate extends StatelessWidget {
  const _PremiumGate({
    required this.title,
    required this.message,
    required this.onUpgrade,
  });

  final String title;
  final String message;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(message, style: const TextStyle(color: AppColors.muted)),
            const SizedBox(height: 14),
            MiroirButton(
              label: 'Upgrade',
              icon: Icons.workspace_premium_rounded,
              onPressed: onUpgrade,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.muted)),
          const SizedBox(height: 6),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
          ),
        ],
      ),
    );
  }
}

class _ProductThumb extends StatelessWidget {
  const _ProductThumb({required this.url});
  final String url;

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) {
      return _thumbBox(const Icon(Icons.image_not_supported_outlined));
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Image.network(
        url,
        width: 74,
        height: 74,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _thumbBox(
          const Icon(Icons.broken_image_outlined),
        ),
      ),
    );
  }

  Widget _thumbBox(Widget child) {
    return Container(
      width: 74,
      height: 74,
      color: AppColors.canvas,
      child: Center(child: child),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      child: Row(
        children: [
          const SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(label)),
        ],
      ),
    );
  }
}

class _MessageCard extends StatelessWidget {
  const _MessageCard({
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 8),
          Text(message, style: const TextStyle(color: AppColors.muted)),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 14),
            MiroirButton(label: actionLabel!, onPressed: onAction),
          ],
        ],
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError(this.message);
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.redAccent.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(
          message,
          style: const TextStyle(color: Colors.redAccent),
        ),
      ),
    );
  }
}

String _formatMoney(num value) {
  final raw = value.round().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < raw.length; i++) {
    final reverseIndex = raw.length - i;
    buffer.write(raw[i]);
    if (reverseIndex > 1 && reverseIndex % 3 == 1) buffer.write('.');
  }
  return '$buffer VND';
}

class _RangeSelector extends StatelessWidget {
  const _RangeSelector({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: ['7d', '30d', '90d'].map((range) {
        final selected = value == range;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: range == '90d' ? 0 : 8),
            child: ChoiceChip(
              label: Center(child: Text(range)),
              selected: selected,
              onSelected: (_) => onChanged(range),
              selectedColor: AppColors.ink,
              backgroundColor: Colors.white,
              side: const BorderSide(color: AppColors.line),
              labelStyle: TextStyle(
                color: selected ? Colors.white : AppColors.ink,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _PerformanceAnalyticsView extends StatelessWidget {
  const _PerformanceAnalyticsView({required this.data, required this.commerce});

  final Map<String, dynamic> data;
  final Map<String, dynamic>? commerce;

  @override
  Widget build(BuildContext context) {
    final summary = _asMap(data['summary']);
    final sales = _asMap(commerce?['summary']);
    final funnel = _asMap(commerce?['funnel']);
    final inventory = _asMap(commerce?['inventoryHealth']);
    final salesSeries = _asList(commerce?['salesSeries']);
    final orderStatuses = _asList(commerce?['orderStatusBreakdown']);
    final paymentStatuses = _asList(commerce?['paymentStatusBreakdown']);
    final engagementProducts = _asList(data['topProducts']);
    final salesProducts = _asList(commerce?['topProducts']);
    final engagementMetrics = [
      _MetricData('Views', _metric(summary, 'productViews')),
      _MetricData('Try-ons', _metric(summary, 'tryOnClicks')),
      _MetricData('Stylist', _metric(summary, 'stylistMatches')),
      _MetricData('Feedback', _metric(summary, 'feedbackCount')),
      _MetricData('Conversion', _percent(summary['conversionRate'])),
      _MetricData('Published', _metric(summary, 'publishedProducts')),
    ];
    final salesMetrics = [
      _MetricData('Collected revenue', _formatMoney(_number(sales['collectedRevenue']))),
      _MetricData('Projected revenue', _formatMoney(_number(sales['projectedRevenue']))),
      _MetricData('Orders', _metric(sales, 'totalOrders')),
      _MetricData('Average order', _formatMoney(_number(sales['averageOrderValue']))),
      _MetricData('Pending orders', _metric(sales, 'pendingOrders')),
      _MetricData('Refund value', _formatMoney(_number(sales['refundValue']))),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _AnalyticsHero(
          title: 'Performance dashboard',
          subtitle: 'Sales, customer actions, and AI discovery for this shop.',
        ),
        const SizedBox(height: 16),
        const _AnalyticsSectionTitle('Sales overview'),
        const SizedBox(height: 10),
        _MetricGrid(metrics: salesMetrics),
        const SizedBox(height: 16),
        _RevenueTrendCard(series: salesSeries),
        const SizedBox(height: 16),
        _BreakdownCharts(
          orderStatuses: orderStatuses,
          paymentStatuses: paymentStatuses,
        ),
        const SizedBox(height: 16),
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Customer journey', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
              const SizedBox(height: 14),
              _FunnelChart(data: funnel),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const _AnalyticsSectionTitle('Product & AI engagement'),
        const SizedBox(height: 10),
        _MetricGrid(metrics: engagementMetrics),
        const SizedBox(height: 16),
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Catalog health', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _HealthPill('Published', _number(inventory['published'])),
                  _HealthPill('Draft', _number(inventory['draft'])),
                  _HealthPill('Out of stock', _number(inventory['outOfStock'])),
                  _HealthPill('Needs embedding', _number(inventory['needsEmbedding'])),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _SalesProductsCard(products: salesProducts),
        const SizedBox(height: 16),
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Top products by engagement', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
              const SizedBox(height: 12),
              if (engagementProducts.isEmpty)
                const Text('No analytics events yet.', style: TextStyle(color: AppColors.muted))
              else
                ...engagementProducts.map((item) => _TopProductAnalyticsTile(data: _asMap(item))),
            ],
          ),
        ),
      ],
    );
  }
}

class _RevenueTrendCard extends StatelessWidget {
  const _RevenueTrendCard({required this.series});
  final List<dynamic> series;

  @override
  Widget build(BuildContext context) {
    final points = series.map(_asMap).toList();
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Revenue trend', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          const Text('Collected versus projected revenue in the selected period.', style: TextStyle(color: AppColors.muted)),
          const SizedBox(height: 16),
          const Wrap(
            spacing: 16,
            children: [
              _ChartLegend(color: AppColors.accentStrong, label: 'Collected'),
              _ChartLegend(color: AppColors.moss, label: 'Projected'),
            ],
          ),
          const SizedBox(height: 16),
          if (points.isEmpty)
            const _ChartEmptyState()
          else
            SizedBox(height: 180, width: double.infinity, child: CustomPaint(painter: _RevenueTrendPainter(points))),
        ],
      ),
    );
  }
}

class _BreakdownCharts extends StatelessWidget {
  const _BreakdownCharts({required this.orderStatuses, required this.paymentStatuses});
  final List<dynamic> orderStatuses;
  final List<dynamic> paymentStatuses;

  @override
  Widget build(BuildContext context) => Column(
        children: [
          _BreakdownChartCard(title: 'Order status', items: orderStatuses),
          const SizedBox(height: 16),
          _BreakdownChartCard(title: 'Payment status', items: paymentStatuses),
        ],
      );
}

class _BreakdownChartCard extends StatelessWidget {
  const _BreakdownChartCard({required this.title, required this.items});
  final String title;
  final List<dynamic> items;

  @override
  Widget build(BuildContext context) {
    final data = items.map(_asMap).where((item) => _number(item['count']) > 0).toList();
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(height: 16),
          if (data.isEmpty)
            const _ChartEmptyState()
          else
            Row(
              children: [
                SizedBox(width: 116, height: 116, child: CustomPaint(painter: _DonutPainter(data))),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    children: data.take(4).map((item) {
                      final index = data.indexOf(item);
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          children: [
                            Container(width: 10, height: 10, decoration: BoxDecoration(color: _chartColor(index), shape: BoxShape.circle)),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_displayStatus(item['label']), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700))),
                            Text('${_number(item['count'])}', style: const TextStyle(fontWeight: FontWeight.w900)),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _FunnelChart extends StatelessWidget {
  const _FunnelChart({required this.data});
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final steps = [
      ('Views', _number(data['views'])),
      ('Try-ons', _number(data['tryOns'])),
      ('Stylist', _number(data['stylistMatches'])),
      ('Orders', _number(data['orders'])),
      ('Paid', _number(data['paidOrders'])),
    ];
    final maxValue = math.max(1, steps.map((step) => step.$2).fold(0, math.max));
    return Column(
      children: steps.map((step) {
        final ratio = step.$2 / maxValue;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              SizedBox(width: 72, child: Text(step.$1, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700))),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: ratio.toDouble(),
                    minHeight: 10,
                    color: AppColors.accentStrong,
                    backgroundColor: AppColors.accentSoft,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(width: 36, child: Text('${step.$2}', textAlign: TextAlign.end, style: const TextStyle(fontWeight: FontWeight.w900))),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _ChartLegend extends StatelessWidget {
  const _ChartLegend({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.w700)),
        ],
      );
}

class _ChartEmptyState extends StatelessWidget {
  const _ChartEmptyState();
  @override
  Widget build(BuildContext context) => const SizedBox(
        height: 116,
        child: Center(child: Text('No data for this period.', style: TextStyle(color: AppColors.muted))),
      );
}

class _RevenueTrendPainter extends CustomPainter {
  _RevenueTrendPainter(this.points);
  final List<Map<String, dynamic>> points;

  @override
  void paint(Canvas canvas, Size size) {
    const inset = 8.0;
    final values = points.expand((point) => [_number(point['collectedRevenue']), _number(point['projectedRevenue'])]);
    final maxValue = math.max(1, values.fold(0, math.max));
    final gridPaint = Paint()..color = AppColors.line..strokeWidth = 1;
    for (var index = 0; index < 4; index++) {
      final y = inset + ((size.height - inset * 2) * index / 3);
      canvas.drawLine(Offset(inset, y), Offset(size.width - inset, y), gridPaint);
    }
    _drawLine(canvas, size, 'collectedRevenue', maxValue, AppColors.accentStrong);
    _drawLine(canvas, size, 'projectedRevenue', maxValue, AppColors.moss);
  }

  void _drawLine(Canvas canvas, Size size, String key, num maxValue, Color color) {
    final path = Path();
    final width = size.width - 16;
    final height = size.height - 16;
    for (var index = 0; index < points.length; index++) {
      final x = (8 + (points.length == 1 ? width / 2 : width * index / (points.length - 1))).toDouble();
      final y = (8 + height - (height * _number(points[index][key]) / maxValue)).toDouble();
      if (index == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    final paint = Paint()..color = color..strokeWidth = 3..style = PaintingStyle.stroke..strokeCap = StrokeCap.round..strokeJoin = StrokeJoin.round;
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _RevenueTrendPainter oldDelegate) => oldDelegate.points != points;
}

class _DonutPainter extends CustomPainter {
  _DonutPainter(this.items);
  final List<Map<String, dynamic>> items;

  @override
  void paint(Canvas canvas, Size size) {
    final total = math.max(1, items.fold(0, (sum, item) => sum + _number(item['count'])));
    final rect = Offset.zero & size;
    final center = rect.center;
    final radius = (math.min(size.width, size.height) / 2 - 10).toDouble();
    final paint = Paint()..style = PaintingStyle.stroke..strokeWidth = 20..strokeCap = StrokeCap.butt;
    var start = -math.pi / 2;
    for (var index = 0; index < items.length; index++) {
      final sweep = (math.pi * 2 * _number(items[index]['count']) / total).toDouble();
      paint.color = _chartColor(index);
      canvas.drawArc(Rect.fromCircle(center: center, radius: radius), start, sweep, false, paint);
      start += sweep;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutPainter oldDelegate) => oldDelegate.items != items;
}

Color _chartColor(int index) {
  const colors = [AppColors.accentStrong, AppColors.moss, AppColors.mossSoft, AppColors.success, AppColors.mutedSoft];
  return colors[index % colors.length];
}

String _displayStatus(Object? value) {
  const labels = {
    'pending_confirmation': 'Pending confirmation',
    'preparing': 'Preparing',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'cod_pending': 'COD pending',
    'awaiting_transfer': 'Awaiting transfer',
    'pending_verification': 'Payment verification',
    'paid': 'Paid',
    'refund_pending': 'Refund pending',
    'refunded': 'Refunded',
  };
  final text = (value ?? 'Unknown').toString();
  return labels[text] ?? text.replaceAll('_', ' ');
}
class _MetricGrid extends StatelessWidget {
  const _MetricGrid({required this.metrics});
  final List<_MetricData> metrics;

  @override
  Widget build(BuildContext context) => GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: metrics.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisExtent: 92,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
        ),
        itemBuilder: (context, index) => _MetricCard(metric: metrics[index]),
      );
}

class _AnalyticsSectionTitle extends StatelessWidget {
  const _AnalyticsSectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
      );
}

class _FunnelRow extends StatelessWidget {
  const _FunnelRow({required this.label, required this.value, this.isLast = false});
  final String label;
  final int value;
  final bool isLast;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
        child: Row(
          children: [
            Expanded(child: Text(label, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700))),
            Text('$value', style: const TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
      );
}

class _HealthPill extends StatelessWidget {
  const _HealthPill(this.label, this.value);
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) => Chip(
        label: Text('$label: $value'),
        backgroundColor: AppColors.accentSoft,
        side: BorderSide.none,
        labelStyle: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.ink),
      );
}

class _SalesProductsCard extends StatelessWidget {
  const _SalesProductsCard({required this.products});
  final List<dynamic> products;

  @override
  Widget build(BuildContext context) => SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Best sellers', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            if (products.isEmpty)
              const Text('No paid orders in this period.', style: TextStyle(color: AppColors.muted))
            else
              ...products.map((item) {
                final product = _asMap(item);
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text((product['name'] ?? 'Product').toString(), style: const TextStyle(fontWeight: FontWeight.w800)),
                  subtitle: Text('${_displayValue(product['quantity'])} sold'),
                  trailing: Text(_formatMoney(_number(product['collectedRevenue'])), style: const TextStyle(fontWeight: FontWeight.w900)),
                );
              }),
          ],
        ),
      );
}
class _AnalyticsHero extends StatelessWidget {
  const _AnalyticsHero({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: AppColors.muted)),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.metric});
  final _MetricData metric;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            metric.label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.muted,
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            metric.value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.ink,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _TopProductAnalyticsTile extends StatelessWidget {
  const _TopProductAnalyticsTile({required this.data});
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9FB),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          _ProductThumb(url: (data['imageUrl'] ?? '').toString()),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (data['name'] ?? 'Product').toString(),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _MiniStat('Views', data['views']),
                    _MiniStat('Try-ons', data['tryOns']),
                    _MiniStat('Stylist', data['stylistMatches']),
                    _MiniStat('Feedback', data['feedbackCount']),
                    _MiniStat('Rating', data['averageRating']),
                    _MiniStat('Conv.', _percent(data['conversionRate'])),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat(this.label, this.value);
  final String label;
  final Object? value;

  @override
  Widget build(BuildContext context) {
    return Text(
      '$label ${_displayValue(value)}',
      style: const TextStyle(
        color: AppColors.muted,
        fontSize: 12,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _CustomerInsightsView extends StatelessWidget {
  const _CustomerInsightsView({required this.data});
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final enoughData = data['enoughData'] == true;
    if (!enoughData) {
      return _MessageCard(
        title: 'Not enough data yet',
        message:
            '${data['message'] ?? 'Privacy threshold applies before breakdowns are shown.'}\nEvents: ${data['eventCount'] ?? 0}, users: ${data['userCount'] ?? 0}.',
      );
    }

    final breakdowns = _asMap(data['breakdowns']);
    final cards = [
      _BreakdownData('Gender', _asList(breakdowns['gender'])),
      _BreakdownData('Body shape', _asList(breakdowns['bodyShape'])),
      _BreakdownData('Skin tone', _asList(breakdowns['skinTone'])),
      _BreakdownData(
          'Style preferences', _asList(breakdowns['stylePreferences'])),
      _BreakdownData('Occasions', _asList(breakdowns['occasions'])),
      _BreakdownData('Budget buckets', _asList(breakdowns['budgetBuckets'])),
      _BreakdownData('Interested style tags', _asList(breakdowns['styleTags'])),
      _BreakdownData('Interested colors', _asList(breakdowns['colors'])),
      _BreakdownData('Ratings', _asList(breakdowns['ratings'])),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _AnalyticsHero(
          title: 'Anonymous customer insights',
          subtitle: 'Privacy threshold applies before breakdowns are shown.',
        ),
        const SizedBox(height: 12),
        ...cards.map((card) => _BreakdownCard(data: card)),
      ],
    );
  }
}

class _BreakdownCard extends StatelessWidget {
  const _BreakdownCard({required this.data});
  final _BreakdownData data;

  @override
  Widget build(BuildContext context) {
    final maxValue = data.items
        .map((item) => (_asMap(item)['count'] as num?)?.toDouble() ?? 0)
        .fold<double>(0, (max, value) => value > max ? value : max);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              data.title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 12),
            if (data.items.isEmpty)
              const Text('No data yet.',
                  style: TextStyle(color: AppColors.muted))
            else
              ...data.items.map((item) {
                final row = _asMap(item);
                final label = (row['label'] ?? '').toString();
                final count = (row['count'] as num?)?.toDouble() ?? 0;
                final widthFactor = maxValue <= 0 ? 0.0 : count / maxValue;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ),
                          Text(
                            count.toStringAsFixed(count % 1 == 0 ? 0 : 1),
                            style: const TextStyle(color: AppColors.muted),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          minHeight: 7,
                          value: widthFactor.clamp(0.0, 1.0),
                          backgroundColor: const Color(0xFFEAF0F6),
                          valueColor:
                              const AlwaysStoppedAnimation(AppColors.ink),
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _MetricData {
  const _MetricData(this.label, this.value);
  final String label;
  final String value;
}

class _BreakdownData {
  const _BreakdownData(this.title, this.items);
  final String title;
  final List<dynamic> items;
}

Map<String, dynamic> _asMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map)
    return value.map((key, val) => MapEntry(key.toString(), val));
  return const {};
}

List<dynamic> _asList(Object? value) {
  if (value is List) return value;
  return const [];
}

int _number(Object? value) {
  if (value is num) return value.round();
  return num.tryParse('$value')?.round() ?? 0;
}

String _metric(Map<String, dynamic> data, String key) {
  return _displayValue(data[key] ?? 0);
}

String _percent(Object? value) {
  final number =
      value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
  return '${(number * 100).round()}%';
}

String _displayValue(Object? value) {
  if (value == null) return '-';
  if (value is num) {
    if (value % 1 == 0) return value.toInt().toString();
    return value.toStringAsFixed(1);
  }
  final text = value.toString();
  return text.isEmpty ? '-' : text;
}
