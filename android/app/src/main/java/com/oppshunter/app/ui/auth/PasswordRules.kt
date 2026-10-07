package com.oppshunter.app.ui.auth

object PasswordRules {
    private const val MIN_LENGTH = 8
    private const val MAX_LENGTH = 72

    fun validate(password: String): String? = when {
        password.length < MIN_LENGTH -> "Password must be at least 8 characters"
        password.length > MAX_LENGTH -> "Password must be at most 72 characters"
        password.none { it in 'A'..'Z' || it in 'a'..'z' } -> "Password must contain a letter"
        password.none { it in '0'..'9' } -> "Password must contain a number"
        else -> null
    }
}