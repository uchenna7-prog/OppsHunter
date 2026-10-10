package com.oppshunter.app.features.onboarding

import android.content.Context

class OnboardingPrefs(context: Context) {

    private val prefs = context.getSharedPreferences("onboarding", Context.MODE_PRIVATE)

    var seen: Boolean
        get() = prefs.getBoolean("seen", false)
        set(value) {
            prefs.edit().putBoolean("seen", value).apply()
        }

    var hasAccount: Boolean
        get() = prefs.getBoolean("has_account", false)
        set(value) {
            prefs.edit().putBoolean("has_account", value).apply()
        }
}