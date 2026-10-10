package com.oppshunter.app.features.auth.ui

import android.app.Application
import android.os.Build
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.oppshunter.app.features.auth.data.AuthRepository
import com.oppshunter.app.features.auth.data.AuthResult
import com.oppshunter.app.core.network.NetworkModule
import com.oppshunter.app.core.storage.TokenStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthScreenState(
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val tokenStore = TokenStore(application)
    private val api = NetworkModule.create(application)
    private val repository = AuthRepository(api, tokenStore)

    private val _state = MutableStateFlow(AuthScreenState())
    val state: StateFlow<AuthScreenState> = _state.asStateFlow()

    val isLoggedIn = repository.isLoggedIn

    fun register(email: String, password: String) {
        _state.value = AuthScreenState(isLoading = true)
        viewModelScope.launch {
            handleResult(repository.register(email.trim(), password, deviceName = Build.MODEL))
        }
    }

    fun login(email: String, password: String) {
        _state.value = AuthScreenState(isLoading = true)
        viewModelScope.launch {
            handleResult(repository.login(email.trim(), password, deviceName = Build.MODEL))
        }
    }

    fun loginWithGoogle(idToken: String) {
        _state.value = AuthScreenState(isLoading = true)
        viewModelScope.launch {
            handleResult(repository.loginWithGoogle(idToken, deviceName = Build.MODEL))
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
        }
    }

    fun showError(message: String) {
        _state.value = AuthScreenState(isLoading = false, errorMessage = message)
    }

    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }

    private fun handleResult(result: AuthResult) {
        _state.value = when (result) {
            is AuthResult.Success -> AuthScreenState()
            is AuthResult.Failure -> AuthScreenState(errorMessage = result.message)
        }
    }
}