class TryOnCreateResponse {
  const TryOnCreateResponse({
    required this.success,
    required this.taskId,
    required this.message,
  });

  final bool success;
  final String taskId;
  final String message;

  factory TryOnCreateResponse.fromJson(Map<String, dynamic> json) {
    return TryOnCreateResponse(
      success: json['success'] == true,
      taskId: (json['taskId'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
    );
  }
}

class TryOnStatusResponse {
  const TryOnStatusResponse({
    required this.success,
    required this.status,
    required this.resultUrl,
    required this.errorMessage,
  });

  final bool success;
  final String status;
  final String? resultUrl;
  final String? errorMessage;

  factory TryOnStatusResponse.fromJson(Map<String, dynamic> json) {
    return TryOnStatusResponse(
      success: json['success'] == true,
      status: (json['status'] ?? 'pending').toString(),
      resultUrl: json['resultUrl'] as String?,
      errorMessage: json['errorMessage'] as String?,
    );
  }
}
