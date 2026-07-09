import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/app/app_session_controller.dart';
import '../../../core/app/app_session_scope.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/local_image_data.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../../../shared/widgets/section_card.dart';
import '../data/owner_shop_models.dart';
import 'controllers/shop_auth_controller.dart';
import 'controllers/shop_dashboard_controller.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _shopNameController = TextEditingController();
  final _shopSlugController = TextEditingController();
  final _shopDescriptionController = TextEditingController();
  final _shopLogoController = TextEditingController();
  final _shopCoverController = TextEditingController();
  final _authFormKey = GlobalKey<FormState>();
  final _shopFormKey = GlobalKey<FormState>();

  AppSessionController? _sessionController;
  ShopAuthController? _authController;
  ShopDashboardController? _dashboardController;
  String _lastSessionKey = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final sessionController = AppSessionScope.of(context);
    if (_sessionController == sessionController) {
      return;
    }

    _sessionController?.removeListener(_handleSessionChanged);
    _sessionController = sessionController;
    _sessionController!.addListener(_handleSessionChanged);
    _authController ??=
        ShopAuthController(sessionController: _sessionController!);
    _dashboardController ??= ShopDashboardController(
      sessionController: _sessionController!,
    );
    _handleSessionChanged();
  }

  void _handleSessionChanged() {
    final dashboard = _dashboardController;
    final sessionController = _sessionController;
    if (dashboard == null || sessionController == null) {
      return;
    }

    final sessionKey = sessionController.session?.token ?? '';
    if (_lastSessionKey != sessionKey) {
      _lastSessionKey = sessionKey;
      dashboard.loadDashboard();
    }

    if (!sessionController.isSignedIn) {
      _shopNameController.clear();
      _shopSlugController.clear();
      _shopDescriptionController.clear();
      _shopLogoController.clear();
      _shopCoverController.clear();
    }

    if (mounted) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    _sessionController?.removeListener(_handleSessionChanged);
    _authController?.dispose();
    _dashboardController?.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _shopNameController.dispose();
    _shopSlugController.dispose();
    _shopDescriptionController.dispose();
    _shopLogoController.dispose();
    _shopCoverController.dispose();
    super.dispose();
  }

  Future<void> _submitAuth() async {
    final authController = _authController;
    if (authController == null) {
      return;
    }

    if (!_authFormKey.currentState!.validate()) {
      return;
    }

    final success = await authController.submit(
      name: _nameController.text,
      email: _emailController.text,
      password: _passwordController.text,
    );

    if (success) {
      _passwordController.clear();
    }
  }

  Future<void> _saveShop() async {
    final dashboardController = _dashboardController;
    if (dashboardController == null) {
      return;
    }

    if (!_shopFormKey.currentState!.validate()) {
      return;
    }

    await dashboardController.saveShop(
      name: _shopNameController.text,
      slug: _shopSlugController.text,
      description: _shopDescriptionController.text,
      logoUrl: _shopLogoController.text,
      coverUrl: _shopCoverController.text,
    );
  }

  Future<void> _openProductEditor([ShopProduct? product]) async {
    final dashboardController = _dashboardController;
    if (dashboardController == null) {
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _ProductEditorSheet(
          dashboardController: dashboardController,
          product: product,
        );
      },
    );
  }

  void _syncShopFields(OwnerShop? shop) {
    if (shop == null) {
      return;
    }

    if (_shopNameController.text != shop.name) {
      _shopNameController.text = shop.name;
    }
    if (_shopSlugController.text != shop.slug) {
      _shopSlugController.text = shop.slug;
    }
    if (_shopDescriptionController.text != shop.description) {
      _shopDescriptionController.text = shop.description;
    }
    if (_shopLogoController.text != shop.logoUrl) {
      _shopLogoController.text = shop.logoUrl;
    }
    if (_shopCoverController.text != shop.coverUrl) {
      _shopCoverController.text = shop.coverUrl;
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionController = _sessionController;
    final authController = _authController;
    final dashboardController = _dashboardController;
    if (sessionController == null ||
        authController == null ||
        dashboardController == null) {
      return const SizedBox.shrink();
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Account', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(
          'Diagnostics, shop-owner access, and product management live here in the V1 runtime shell.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 20),
        _DiagnosticsCard(sessionController: sessionController),
        const SizedBox(height: 16),
        if (sessionController.sessionMessage.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: SectionCard(
              child: Text(
                sessionController.sessionMessage,
                style: const TextStyle(color: Colors.redAccent),
              ),
            ),
          ),
        if (sessionController.isRestoring)
          const SectionCard(
            child: Column(
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 12),
                Text('Restoring saved owner session...'),
              ],
            ),
          )
        else if (!sessionController.isSignedIn)
          ListenableBuilder(
            listenable: authController,
            builder: (context, _) {
              return SectionCard(
                child: Form(
                  key: _authFormKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Shop Owner Access',
                          style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 12),
                      SegmentedButton<ShopAuthMode>(
                        segments: const [
                          ButtonSegment<ShopAuthMode>(
                            value: ShopAuthMode.login,
                            label: Text('Login'),
                          ),
                          ButtonSegment<ShopAuthMode>(
                            value: ShopAuthMode.register,
                            label: Text('Register'),
                          ),
                        ],
                        selected: {authController.mode},
                        onSelectionChanged: (selection) {
                          authController.setMode(selection.first);
                        },
                      ),
                      const SizedBox(height: 16),
                      if (authController.mode == ShopAuthMode.register) ...[
                        TextFormField(
                          controller: _nameController,
                          decoration:
                              const InputDecoration(labelText: 'Owner name'),
                          validator: (value) {
                            if (authController.mode == ShopAuthMode.register &&
                                (value == null || value.trim().isEmpty)) {
                              return 'Owner name is required.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextFormField(
                        controller: _emailController,
                        decoration: const InputDecoration(labelText: 'Email'),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Email is required.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration:
                            const InputDecoration(labelText: 'Password'),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Password is required.';
                          }
                          if (authController.mode == ShopAuthMode.register &&
                              value.length < 8) {
                            return 'Password must be at least 8 characters.';
                          }
                          return null;
                        },
                      ),
                      if (authController.errorMessage.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text(
                          authController.errorMessage,
                          style: const TextStyle(color: Colors.redAccent),
                        ),
                      ],
                      const SizedBox(height: 16),
                      MiroirButton(
                        label: authController.isSubmitting
                            ? 'Submitting...'
                            : authController.mode == ShopAuthMode.login
                                ? 'Sign In'
                                : 'Create Owner Account',
                        onPressed:
                            authController.isSubmitting ? null : _submitAuth,
                        icon: Icons.lock_open_outlined,
                      ),
                    ],
                  ),
                ),
              );
            },
          )
        else ...[
          _OwnerSummaryCard(sessionController: sessionController),
          const SizedBox(height: 16),
          ListenableBuilder(
            listenable: dashboardController,
            builder: (context, _) {
              _syncShopFields(dashboardController.shop);
              return Column(
                children: [
                  if (dashboardController.errorMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: SectionCard(
                        child: Text(
                          dashboardController.errorMessage,
                          style: const TextStyle(color: Colors.redAccent),
                        ),
                      ),
                    ),
                  if (dashboardController.statusMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: SectionCard(
                        child: Text(dashboardController.statusMessage),
                      ),
                    ),
                  if (dashboardController.state == ShopDashboardState.loading)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 16),
                      child: SectionCard(
                        child: Column(
                          children: [
                            CircularProgressIndicator(),
                            SizedBox(height: 12),
                            Text('Loading shop dashboard...'),
                          ],
                        ),
                      ),
                    ),
                  SectionCard(
                    child: Form(
                      key: _shopFormKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            dashboardController.shop == null
                                ? 'Create Your Shop'
                                : 'Shop Profile',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _shopNameController,
                            decoration:
                                const InputDecoration(labelText: 'Shop name'),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Shop name is required.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _shopSlugController,
                            decoration:
                                const InputDecoration(labelText: 'Slug'),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Slug is required.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _shopDescriptionController,
                            maxLines: 3,
                            decoration:
                                const InputDecoration(labelText: 'Description'),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _shopLogoController,
                            decoration:
                                const InputDecoration(labelText: 'Logo URL'),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _shopCoverController,
                            decoration:
                                const InputDecoration(labelText: 'Cover URL'),
                          ),
                          const SizedBox(height: 16),
                          MiroirButton(
                            label: dashboardController.isSavingShop
                                ? 'Saving Shop...'
                                : dashboardController.shop == null
                                    ? 'Create Shop'
                                    : 'Save Shop',
                            onPressed: dashboardController.isSavingShop
                                ? null
                                : _saveShop,
                            icon: Icons.storefront_outlined,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text('Products',
                                  style:
                                      Theme.of(context).textTheme.titleLarge),
                            ),
                            TextButton(
                              onPressed: dashboardController.shop == null ||
                                      dashboardController.isSavingProduct
                                  ? null
                                  : () => _openProductEditor(),
                              child: const Text('Add Product'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (dashboardController.shop == null)
                          const Text(
                              'Create your shop first before adding products.')
                        else if (dashboardController.products.isEmpty)
                          const Text(
                              'No products yet. Add your first product to test the owner flow.')
                        else
                          ...dashboardController.products.map(
                            (product) => Padding(
                              padding: const EdgeInsets.only(top: 12),
                              child: _ProductCard(
                                product: product,
                                isBusy: dashboardController.isMutatingProduct ||
                                    dashboardController.isSavingProduct,
                                onEdit: () => _openProductEditor(product),
                                onArchive: product.status == 'archived' ||
                                        product.status == 'trashed'
                                    ? null
                                    : () => dashboardController
                                        .archiveProduct(product.id),
                                onRestore: product.status == 'archived' ||
                                        product.status == 'trashed'
                                    ? () => dashboardController
                                        .restoreProduct(product.id)
                                    : null,
                                onDelete: product.status == 'trashed'
                                    ? null
                                    : () => dashboardController
                                        .deleteProduct(product.id),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ],
    );
  }
}

class _DiagnosticsCard extends StatelessWidget {
  const _DiagnosticsCard({required this.sessionController});

  final AppSessionController sessionController;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: sessionController,
      builder: (context, _) {
        final healthy = sessionController.backendHealthy;
        final statusText = healthy == null
            ? 'Not checked yet'
            : healthy
                ? 'Healthy'
                : 'Unavailable';

        return SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Diagnostics',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              Text('API base URL: ${sessionController.apiBaseUrl}'),
              const SizedBox(height: 4),
              Text('Platform: ${sessionController.platformLabel}'),
              const SizedBox(height: 4),
              Text('Backend health: ${statusText}'),
              if (sessionController.healthMessage.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(sessionController.healthMessage),
              ],
              const SizedBox(height: 12),
              const Text(
                'For a real Android phone, pass your LAN backend URL through --dart-define=API_BASE_URL=http://YOUR_IP:5000/api.',
              ),
              const SizedBox(height: 16),
              MiroirButton(
                label: sessionController.isCheckingHealth
                    ? 'Checking Backend...'
                    : 'Run Health Check',
                onPressed: sessionController.isCheckingHealth
                    ? null
                    : sessionController.checkBackendHealth,
                icon: Icons.monitor_heart_outlined,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _OwnerSummaryCard extends StatelessWidget {
  const _OwnerSummaryCard({required this.sessionController});

  final AppSessionController sessionController;

  @override
  Widget build(BuildContext context) {
    final session = sessionController.session!;
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Signed In', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(session.owner.name),
          const SizedBox(height: 4),
          Text(session.owner.email,
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text('Status: ${session.owner.status}'),
          const SizedBox(height: 16),
          MiroirButton(
            label: 'Logout',
            onPressed: () {
              sessionController.logout();
            },
            icon: Icons.logout,
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({
    required this.product,
    required this.isBusy,
    required this.onEdit,
    this.onArchive,
    this.onRestore,
    this.onDelete,
  });

  final ShopProduct product;
  final bool isBusy;
  final VoidCallback onEdit;
  final VoidCallback? onArchive;
  final VoidCallback? onRestore;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(product.name,
                        style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text(
                        '${product.category} • ${product.price.toStringAsFixed(0)} VND'),
                    const SizedBox(height: 4),
                    Text(
                        'Status: ${product.status} • Stock: ${product.availability}'),
                    const SizedBox(height: 4),
                    Text(
                      product.embeddingStale
                          ? 'AI indexing: needs re-embed'
                          : 'AI indexing: ready',
                    ),
                  ],
                ),
              ),
              if (product.imageUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    product.imageUrl,
                    width: 72,
                    height: 72,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const _ImagePlaceholder(),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton(
                onPressed: isBusy ? null : onEdit,
                child: const Text('Edit'),
              ),
              if (onArchive != null)
                OutlinedButton(
                  onPressed: isBusy ? null : onArchive,
                  child: const Text('Archive'),
                ),
              if (onRestore != null)
                OutlinedButton(
                  onPressed: isBusy ? null : onRestore,
                  child: const Text('Restore'),
                ),
              if (onDelete != null)
                OutlinedButton(
                  onPressed: isBusy ? null : onDelete,
                  child: const Text('Trash'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProductEditorSheet extends StatefulWidget {
  const _ProductEditorSheet({
    required this.dashboardController,
    this.product,
  });

  final ShopDashboardController dashboardController;
  final ShopProduct? product;

  @override
  State<_ProductEditorSheet> createState() => _ProductEditorSheetState();
}

class _ProductEditorSheetState extends State<_ProductEditorSheet> {
  final _formKey = GlobalKey<FormState>();
  final _picker = ImagePicker();
  late final TextEditingController _nameController;
  late final TextEditingController _categoryController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _priceController;
  late final TextEditingController _colorsController;
  late final TextEditingController _sizesController;
  late final TextEditingController _styleTagsController;
  late final TextEditingController _occasionTagsController;
  late final TextEditingController _materialController;
  late final TextEditingController _fitTypeController;
  late String _gender;
  late String _availability;
  late String _status;
  LocalImageData? _localImage;

  @override
  void initState() {
    super.initState();
    final draft = widget.product == null
        ? const ShopProductDraft(
            name: '',
            category: '',
            description: '',
            priceText: '',
            gender: 'unisex',
            availability: 'in_stock',
            status: 'draft',
            colorsText: '',
            sizesText: '',
            styleTagsText: '',
            occasionTagsText: '',
            material: '',
            fitType: '',
          )
        : ShopProductDraft.fromProduct(widget.product!);
    _nameController = TextEditingController(text: draft.name);
    _categoryController = TextEditingController(text: draft.category);
    _descriptionController = TextEditingController(text: draft.description);
    _priceController = TextEditingController(text: draft.priceText);
    _colorsController = TextEditingController(text: draft.colorsText);
    _sizesController = TextEditingController(text: draft.sizesText);
    _styleTagsController = TextEditingController(text: draft.styleTagsText);
    _occasionTagsController =
        TextEditingController(text: draft.occasionTagsText);
    _materialController = TextEditingController(text: draft.material);
    _fitTypeController = TextEditingController(text: draft.fitType);
    _gender = draft.gender;
    _availability = draft.availability;
    _status = draft.status;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _categoryController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _colorsController.dispose();
    _sizesController.dispose();
    _styleTagsController.dispose();
    _occasionTagsController.dispose();
    _materialController.dispose();
    _fitTypeController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file == null) {
      return;
    }

    final bytes = await file.readAsBytes();
    setState(() {
      _localImage = LocalImageData(
        name: file.name,
        bytes: bytes,
        mimeType: file.mimeType,
      );
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final draft = ShopProductDraft(
      name: _nameController.text,
      category: _categoryController.text,
      description: _descriptionController.text,
      priceText: _priceController.text,
      gender: _gender,
      availability: _availability,
      status: _status,
      colorsText: _colorsController.text,
      sizesText: _sizesController.text,
      styleTagsText: _styleTagsController.text,
      occasionTagsText: _occasionTagsController.text,
      material: _materialController.text,
      fitType: _fitTypeController.text,
    );

    await widget.dashboardController.saveProduct(
      productId: widget.product?.id,
      draft: draft,
      localImage: _localImage,
      existingImageUrl: widget.product?.imageUrl ?? '',
      existingImagePublicId: widget.product?.imagePublicId ?? '',
    );

    if (!mounted) {
      return;
    }

    if (widget.dashboardController.errorMessage.isEmpty) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 24, 16, bottomInset + 16),
      child: SectionCard(
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.product == null ? 'Add Product' : 'Edit Product',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                if (_localImage != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.memory(
                      _localImage!.bytes,
                      height: 140,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  )
                else if ((widget.product?.imageUrl ?? '').isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      widget.product!.imageUrl,
                      height: 140,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          const _ImagePlaceholder(height: 140),
                    ),
                  )
                else
                  const _ImagePlaceholder(height: 140),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: _pickImage,
                  child: const Text('Choose Product Image'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Name'),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Name is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _categoryController,
                  decoration: const InputDecoration(labelText: 'Category'),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Category is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Description'),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Description is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _priceController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Price'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Price is required.';
                    }
                    return double.tryParse(value.trim()) == null
                        ? 'Price must be numeric.'
                        : null;
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _gender,
                  decoration: const InputDecoration(labelText: 'Gender'),
                  items: const [
                    DropdownMenuItem(value: 'female', child: Text('Female')),
                    DropdownMenuItem(value: 'male', child: Text('Male')),
                    DropdownMenuItem(value: 'unisex', child: Text('Unisex')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _gender = value ?? 'unisex';
                    });
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _availability,
                  decoration: const InputDecoration(labelText: 'Availability'),
                  items: const [
                    DropdownMenuItem(
                        value: 'in_stock', child: Text('In stock')),
                    DropdownMenuItem(
                        value: 'out_of_stock', child: Text('Out of stock')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _availability = value ?? 'in_stock';
                    });
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _status,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: const [
                    DropdownMenuItem(value: 'draft', child: Text('Draft')),
                    DropdownMenuItem(
                        value: 'published', child: Text('Published')),
                    DropdownMenuItem(
                        value: 'archived', child: Text('Archived')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _status = value ?? 'draft';
                    });
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _colorsController,
                  decoration: const InputDecoration(
                      labelText: 'Colors (comma separated)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _sizesController,
                  decoration: const InputDecoration(
                      labelText: 'Sizes (comma separated)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _styleTagsController,
                  decoration: const InputDecoration(
                      labelText: 'Style Tags (comma separated)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _occasionTagsController,
                  decoration: const InputDecoration(
                      labelText: 'Occasion Tags (comma separated)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _materialController,
                  decoration: const InputDecoration(labelText: 'Material'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _fitTypeController,
                  decoration: const InputDecoration(labelText: 'Fit Type'),
                ),
                if (widget.dashboardController.errorMessage.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    widget.dashboardController.errorMessage,
                    style: const TextStyle(color: Colors.redAccent),
                  ),
                ],
                const SizedBox(height: 16),
                MiroirButton(
                  label: widget.dashboardController.isSavingProduct
                      ? 'Saving Product...'
                      : 'Save Product',
                  onPressed:
                      widget.dashboardController.isSavingProduct ? null : _save,
                  icon: Icons.check,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder({this.height = 72});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: height,
      color: AppColors.panel,
      alignment: Alignment.center,
      child: const Icon(Icons.image_not_supported_outlined,
          color: AppColors.muted),
    );
  }
}
