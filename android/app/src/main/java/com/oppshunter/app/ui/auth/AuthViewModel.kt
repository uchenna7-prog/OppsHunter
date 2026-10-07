package com.oppshunter.app.ui.auth

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.oppshunter.app.data.auth.AuthRepository
import com.oppshunter.app.data.auth.AuthResult
import com.oppshunter.app.data.auth.NetworkModule
import com.oppshunter.app.data.auth.TokenStore
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
            handleResult(repository.register(email.trim(), password, deviceName = android.os.Build.MODEL))
        }
    }

    fun login(email: String, password: String) {
        _state.value = AuthScreenState(isLoading = true)
        viewModelScope.launch {
            handleResult(repository.login(email.trim(), password, deviceName = android.os.Build.MODEL))
        }
    }

    fun loginWithGoogle(idToken: String) {
        _state.value = AuthScreenState(isLoading = true)
        viewModelScope.launch {
            handleResult(repository.loginWithGoogle(idToken, deviceName = android.os.Build.MODEL))
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