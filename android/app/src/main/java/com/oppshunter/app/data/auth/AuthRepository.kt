package com.oppshunter.app.data.auth

import com.google.gson.Gson
import retrofit2.Response

sealed class AuthResult {
    data class Success(val response: AuthResponse) : AuthResult()
    data class Failure(val code: String, val message: String) : AuthResult()
}

class AuthRepository(
    private val api: AuthApi,
    private val tokenStore: TokenStore
) {

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

    val isLoggedIn get() = tokenStore.isLoggedIn

    private suspend fun callAndStore(
        apiCall: suspend () -> Response<AuthResponse>
    ): AuthResult {
        return try {
            val response = apiCall()

            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                tokenStore.saveTokens(body.accessToken, body.refreshToken)
                AuthResult.Success(body)
            } else {
                val errorBody = response.errorBody()?.string()
                val parsed = errorBody?.let {
                    try {
                        Gson().fromJson(it, ApiErrorBody::class.java)
                    } catch (e: Exception) {
                        null
                    }
                }
                AuthResult.Failure(
                    code = parsed?.error?.code ?: "UNKNOWN_ERROR",
                    message = parsed?.error?.message ?: "Something went wrong"
                )
            }
        } catch (e: Exception) {
            AuthResult.Failure(code = "NETWORK_ERROR", message = "Couldn't reach the server")
        }
    }
}