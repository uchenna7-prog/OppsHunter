package com.oppshunter.app.ui.auth

import android.content.Context

class OnboardingPrefs(context: Context) {

    private val prefs = context.getSharedPreferences("onboarding", Context.MODE_PRIVATE)

    var seen: Boolean
        get() = prefs.getBoolean("seen", false)
        set(value) {
            prefs.edit().putBoolean("seen", value).apply()
        }
}