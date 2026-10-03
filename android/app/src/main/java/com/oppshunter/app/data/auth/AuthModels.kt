package com.oppshunter.app.data.auth

data class RegisterRequest(
    val email: String,
    val password: String,
    val deviceName: String? = null
)

data class LoginRequest(
    val email: String,
    val password: String,
    val deviceName: String? = null
)

data class GoogleLoginRequest(
    val idToken: String,
    val deviceName: String? = null
)

data class RefreshRequest(
    val refreshToken: String
)

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String
)

data class ApiErrorBody(
    val error: ApiErrorDetail
)

data class ApiErrorDetail(
    val code: String,
    val message: String
)
