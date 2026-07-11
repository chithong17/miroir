import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/app/app_session_scope.dart';
import '../../../shared/models/local_image_data.dart';
import '../../../shared/widgets/glass_surface.dart';
import '../../../shared/widgets/miroir_button.dart';
import '../data/customer_models.dart';
import 'controllers/user_profile_controller.dart';

class UserProfileOnboardingPage extends StatefulWidget {
  const UserProfileOnboardingPage({super.key});

  @override
  State<UserProfileOnboardingPage> createState() =>
      _UserProfileOnboardingPageState();
}

class _UserProfileOnboardingPageState extends State<UserProfileOnboardingPage> {
  final _formKey = GlobalKey<FormState>();
  final _picker = ImagePicker();
  final _bodyShapeController = TextEditingController();
  final _skinToneController = TextEditingController();
  final _stylePreferencesController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();
  final _bustController = TextEditingController();
  final _waistController = TextEditingController();
  final _hipsController = TextEditingController();
  final _shoulderController = TextEditingController();
  String _gender = '';
  LocalImageData? _localImage;
  UserProfileController? _controller;
  String _seededUserId = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _controller ??= UserProfileController(
      sessionController: AppSessionScope.of(context),
    );
    _seedFromUser();
  }

  void _seedFromUser() {
    final user = _controller?.currentUser;
    if (user == null || _seededUserId == user.id) {
      return;
    }

    _seededUserId = user.id;
    final draft = UserProfileDraft.fromUser(user);
    _gender = draft.gender;
    _bodyShapeController.text = draft.bodyShape;
    _skinToneController.text = draft.skinTone;
    _stylePreferencesController.text = draft.stylePreferencesText;
    _heightController.text = draft.heightText;
    _weightController.text = draft.weightText;
    _bustController.text = draft.bustText;
    _waistController.text = draft.waistText;
    _hipsController.text = draft.hipsText;
    _shoulderController.text = draft.shoulderText;
  }

  @override
  void dispose() {
    _controller?.dispose();
    _bodyShapeController.dispose();
    _skinToneController.dispose();
    _stylePreferencesController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    _bustController.dispose();
    _waistController.dispose();
    _hipsController.dispose();
    _shoulderController.dispose();
    super.dispose();
  }

  Future<void> _pickProfilePhoto() async {
    final file = await _picker.pickImage(source: ImageSource.gallery);
    if (file == null) {
      return;
    }

    final bytes = await file.readAsBytes();
    final image = LocalImageData(
      name: file.name,
      bytes: bytes,
      mimeType: file.mimeType,
    );
    setState(() {
      _localImage = image;
    });
    await _controller!.uploadProfilePhoto(image);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final success = await _controller!.saveProfile(
      UserProfileDraft(
        gender: _gender,
        bodyShape: _bodyShapeController.text,
        skinTone: _skinToneController.text,
        stylePreferencesText: _stylePreferencesController.text,
        heightText: _heightController.text,
        weightText: _weightController.text,
        bustText: _bustController.text,
        waistText: _waistController.text,
        hipsText: _hipsController.text,
        shoulderText: _shoulderController.text,
      ),
    );

    if (success && mounted) {
      setState(() {});
    }
  }

  Future<void> _skip() async {
    await _controller!.skipProfile();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _controller!,
      builder: (context, _) {
        final user = _controller!.currentUser;
        final imageUrl = user?.profile.modelImageUrl ?? '';

        return Scaffold(
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 700),
                  child: GlassSurface(
                    radius: 34,
                    blurSigma: 18,
                    padding: const EdgeInsets.all(22),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Complete your fitting profile',
                              style:
                                  Theme.of(context).textTheme.headlineMedium),
                          const SizedBox(height: 8),
                          Text(
                            'Measurements and a saved model photo make the stylist and future try-on flows more personal. You can skip this for now.',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          const SizedBox(height: 18),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: SizedBox(
                              height: 180,
                              width: double.infinity,
                              child: _localImage != null
                                  ? Image.memory(_localImage!.bytes,
                                      fit: BoxFit.cover)
                                  : imageUrl.isNotEmpty
                                      ? Image.network(
                                          imageUrl,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) =>
                                              const _ProfileImagePlaceholder(),
                                        )
                                      : const _ProfileImagePlaceholder(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: _controller!.isUploadingPhoto
                                ? null
                                : () => _pickProfilePhoto(),
                            child: Text(_controller!.isUploadingPhoto
                                ? 'Uploading photo...'
                                : 'Choose profile photo'),
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            initialValue: _gender.isEmpty ? null : _gender,
                            decoration:
                                const InputDecoration(labelText: 'Gender'),
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
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _bodyShapeController,
                            decoration:
                                const InputDecoration(labelText: 'Body shape'),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _skinToneController,
                            decoration:
                                const InputDecoration(labelText: 'Skin tone'),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _stylePreferencesController,
                            decoration: const InputDecoration(
                                labelText: 'Style preferences'),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            runSpacing: 12,
                            spacing: 12,
                            children: [
                              _MeasureField(
                                  controller: _heightController,
                                  label: 'Height'),
                              _MeasureField(
                                  controller: _weightController,
                                  label: 'Weight'),
                              _MeasureField(
                                  controller: _bustController, label: 'Bust'),
                              _MeasureField(
                                  controller: _waistController, label: 'Waist'),
                              _MeasureField(
                                  controller: _hipsController, label: 'Hips'),
                              _MeasureField(
                                  controller: _shoulderController,
                                  label: 'Shoulder'),
                            ],
                          ),
                          if (_controller!.errorMessage.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(_controller!.errorMessage,
                                style:
                                    const TextStyle(color: Colors.redAccent)),
                          ],
                          if (_controller!.statusMessage.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(_controller!.statusMessage),
                          ],
                          const SizedBox(height: 18),
                          Row(
                            children: [
                              Expanded(
                                child: MiroirButton(
                                  label: _controller!.isSaving
                                      ? 'Saving...'
                                      : 'Save profile',
                                  onPressed: _controller!.isSaving
                                      ? null
                                      : () => _save(),
                                  icon: Icons.check_rounded,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: MiroirButton(
                                  label: 'Skip for now',
                                  onPressed: _controller!.isSaving
                                      ? null
                                      : () => _skip(),
                                  isSecondary: true,
                                  icon: Icons.arrow_forward_rounded,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _MeasureField extends StatelessWidget {
  const _MeasureField({required this.controller, required this.label});

  final TextEditingController controller;
  final String label;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 150,
      child: TextFormField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(labelText: label),
      ),
    );
  }
}

class _ProfileImagePlaceholder extends StatelessWidget {
  const _ProfileImagePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF2F4F7),
      alignment: Alignment.center,
      child: const Icon(Icons.add_a_photo_outlined, size: 42),
    );
  }
}
