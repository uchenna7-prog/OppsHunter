package com.oppshunter.app.features.profile.data

import com.oppshunter.app.core.network.parseApiError
import retrofit2.Response

sealed class ProfileResult<out T> {
    data class Success<out T>(val data: T) : ProfileResult<T>()
    data class Failure(val code: String, val message: String) : ProfileResult<Nothing>()
}

class ProfileRepository(
    private val api: ProfileApi
) {

    suspend fun loadProfile(): ProfileResult<ProfileDto> {
        return try {
            val response = api.getMyProfile()
            val body = response.body()

            if (response.isSuccessful && body != null) {
                ProfileResult.Success(body.profile)
            } else {
                failure(response)
            }
        } catch (e: Exception) {
            ProfileResult.Failure("NETWORK_ERROR", "Couldn't reach the server")
        }
    }

    suspend fun saveDisplayName(name: String): ProfileResult<ProfileDto> {
        return try {
            val response = api.updateMyProfile(
                UpdateProfileRequest(displayName = name, completeOnboarding = true)
            )
            val body = response.body()

            if (response.isSuccessful && body != null) {
                ProfileResult.Success(body)
            } else {
                failure(response)
            }
        } catch (e: Exception) {
            ProfileResult.Failure("NETWORK_ERROR", "Couldn't reach the server")
        }
    }

    private fun failure(response: Response<*>): ProfileResult.Failure {
        val error = parseApiError(response.errorBody()?.string())
        return ProfileResult.Failure(error.code, error.message)
    }
}