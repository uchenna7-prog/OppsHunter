package com.oppshunter.app.ui.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.oppshunter.app.R

class GoogleSignInHelper(private val context: Context) {

    private val credentialManager = CredentialManager.create(context)

    suspend fun getIdToken(): String? {
        val option = GetSignInWithGoogleOption.Builder(
            context.getString(R.string.google_web_client_id)
        ).build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(option)
            .build()

        return try {
            val credential = credentialManager.getCredential(context, request).credential
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                GoogleIdTokenCredential.createFrom(credential.data).idToken
            } else {
                null
            }
        } catch (e: GetCredentialException) {
            null
        }
    }
}