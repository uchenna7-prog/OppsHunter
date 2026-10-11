package com.oppshunter.app.features.profile.data

data class ProfileDto(
    val displayName: String? = null,
    val avatarUrl: String? = null,
    val onboardingCompletedAt: String? = null
)

data class ProfileResponse(
    val profile: ProfileDto
)

data class UpdateProfileRequest(
    val displayName: String? = null,
    val completeOnboarding: Boolean? = null
)