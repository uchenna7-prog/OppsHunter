package com.oppshunter.app.features.profile.data

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH

interface ProfileApi {

    @GET("profiles/me")
    suspend fun getMyProfile(): Response<ProfileResponse>

    @PATCH("profiles/me")
    suspend fun updateMyProfile(@Body request: UpdateProfileRequest): Response<ProfileDto>
}