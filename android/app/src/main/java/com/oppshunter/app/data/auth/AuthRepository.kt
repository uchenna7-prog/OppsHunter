package com.oppshunter.app.data.auth

import com.google.gson.Gson
import retrofit2.Response

sealed class AuthResult {
    data class Success(val response: AuthResponse) : AuthResult()
    data class Failure(val code: String, val message: String) : AuthResult()
}

sealed class ActionResult {
    data object Success : ActionResult()
    data class Failure(val code: String, val message: String) : ActionResult()
}

class AuthRepository(
    private val api: AuthApi,
    private val tokenStore: TokenStore
) {

    val isLoggedIn get() = tokenStore.isLoggedIn

    suspend fun register(email: String, password: String, deviceName: String?): AuthResult {
        return callAndStore {
            api.register(RegisterRequest(email, password, deviceName))
        }
    }

    suspend fun login(email: String, password: String, deviceName: String?): AuthResult {
        return callAndStore {
            api.login(LoginRequest(email, password, deviceName))
        }
    }

    suspend fun loginWithGoogle(idToken: String, deviceName: String?): AuthResult {
        return callAndStore {
            api.loginWithGoogle(GoogleLoginRequest(idToken, deviceName))
        }
    }

    suspend fun logout() {
        try {
            api.logout()
        } catch (e: Exception) {
        }
        tokenStore.clearTokens()
    }

    suspend fun requestEmailVerification(): ActionResult {
        return callAction { api.requestEmailVerification() }
    }

    suspend fun verifyEmail(code: String): ActionResult {
        return callAction { api.verifyEmail(VerifyEmailRequest(code)) }
    }

    suspend fun requestPasswordReset(email: String): ActionResult {
        return callAction { api.requestPasswordReset(PasswordResetRequest(email)) }
    }

    suspend fun resetPassword(email: String, code: String, newPassword: String): ActionResult {
        return callAction { api.resetPassword(ResetPasswordRequest(email, code, newPassword)) }
    }

    private suspend fun callAndStore(
        apiCall: suspend () -> Response<AuthResponse>
    ): AuthResult {
        return try {
            val response = apiCall()
            val body = response.body()

            if (response.isSuccessful && body != null) {
                tokenStore.saveTokens(body.accessToken, body.refreshToken)
                AuthResult.Success(body)
            } else {
                val failure = parseFailure(response.errorBody()?.string())
                AuthResult.Failure(failure.first, failure.second)
            }
        } catch (e: Exception) {
            AuthResult.Failure(code = "NETWORK_ERROR", message = "Couldn't reach the server")
        }
    }

    private suspend fun callAction(
        apiCall: suspend () -> Response<Unit>
    ): ActionResult {
        return try {
            val response = apiCall()

            if (response.isSuccessful) {
                ActionResult.Success
            } else {
                val failure = parseFailure(response.errorBody()?.string())
                ActionResult.Failure(failure.first, failure.second)
            }
        } catch (e: Exception) {
            ActionResult.Failure(code = "NETWORK_ERROR", message = "Couldn't reach the server")
        }
    }

    private fun parseFailure(errorBody: String?): Pair<String, String> {
        val parsed = errorBody?.let {
            try {
                Gson().fromJson(it, ApiErrorBody::class.java)
            } catch (e: Exception) {
                null
            }
        }
        return Pair(
            parsed?.error?.code ?: "UNKNOWN_ERROR",
            parsed?.error?.message ?: "Something went wrong"
        )
    }
}