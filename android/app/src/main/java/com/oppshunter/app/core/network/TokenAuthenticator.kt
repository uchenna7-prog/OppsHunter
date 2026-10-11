package com.oppshunter.app.core.network

import com.oppshunter.app.core.storage.TokenStore
import com.oppshunter.app.features.auth.data.AuthApi
import com.oppshunter.app.features.auth.data.RefreshRequest
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

class TokenAuthenticator(
    private val tokenStore: TokenStore,
    private val refreshApi: AuthApi
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        val sentToken = response.request.header("Authorization")?.removePrefix("Bearer ")
            ?: return null

        if (attemptCount(response) >= 3) return null

        synchronized(this) {
            val latest = tokenStore.getAccessTokenBlocking()
            if (!latest.isNullOrBlank() && latest != sentToken) {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $latest")
                    .build()
            }

            val refreshToken = tokenStore.getRefreshTokenBlocking()
            if (refreshToken.isNullOrBlank()) {
                tokenStore.clearTokens()
                return null
            }

            val result = try {
                runBlocking { refreshApi.refresh(RefreshRequest(refreshToken)) }
            } catch (e: Exception) {
                return null
            }

            val body = result.body()

            if (result.isSuccessful && body != null) {
                tokenStore.saveTokens(body.accessToken, body.refreshToken)
                return response.request.newBuilder()
                    .header("Authorization", "Bearer ${body.accessToken}")
                    .build()
            }

            if (result.code() == 400 || result.code() == 401) {
                tokenStore.clearTokens()
            }

            return null
        }
    }

    private fun attemptCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}