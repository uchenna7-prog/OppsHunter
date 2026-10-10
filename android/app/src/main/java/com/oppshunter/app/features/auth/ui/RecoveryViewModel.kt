package com.oppshunter.app.features.auth.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.oppshunter.app.features.auth.data.ActionResult
import com.oppshunter.app.features.auth.data.AuthRepository
import com.oppshunter.app.core.network.NetworkModule
import com.oppshunter.app.core.storage.TokenStore
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

data class RecoveryState(
    val email: String = "",
    val isSending: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val sendCount: Int = 0
)

sealed interface RecoveryEvent {
    object CodeSent : RecoveryEvent
    object PasswordReset : RecoveryEvent
    object EmailVerified : RecoveryEvent
}

class RecoveryViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = AuthRepository(
        NetworkModule.create(application),
        TokenStore(application)
    )

    private val _state = MutableStateFlow(RecoveryState())
    val state: StateFlow<RecoveryState> = _state.asStateFlow()

    private val _events = Channel<RecoveryEvent>(Channel.BUFFERED)
    val events: Flow<RecoveryEvent> = _events.receiveAsFlow()

    fun clear() {
        _state.value = RecoveryState()
    }

    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }

    fun startVerification(email: String) {
        _state.value = RecoveryState(email = email)
        sendVerificationCode()
    }

    fun sendVerificationCode() {
        if (_state.value.isSending) return
        _state.value = _state.value.copy(isSending = true, errorMessage = null)

        viewModelScope.launch {
            when (val result = repository.requestEmailVerification()) {
                is ActionResult.Success -> _state.value = _state.value.copy(
                    isSending = false,
                    sendCount = _state.value.sendCount + 1
                )
                is ActionResult.Failure -> _state.value = _state.value.copy(
                    isSending = false,
                    errorMessage = result.message
                )
            }
        }
    }

    fun verifyEmail(code: String) {
        if (_state.value.isSubmitting) return
        _state.value = _state.value.copy(isSubmitting = true, errorMessage = null)

        viewModelScope.launch {
            when (val result = repository.verifyEmail(code)) {
                is ActionResult.Success -> {
                    _state.value = _state.value.copy(isSubmitting = false)
                    _events.send(RecoveryEvent.EmailVerified)
                }
                is ActionResult.Failure -> _state.value = _state.value.copy(
                    isSubmitting = false,
                    errorMessage = result.message
                )
            }
        }
    }

    fun requestPasswordReset(email: String) {
        sendResetCode(email, announce = true)
    }

    fun resendPasswordResetCode() {
        sendResetCode(_state.value.email, announce = false)
    }

    private fun sendResetCode(email: String, announce: Boolean) {
        if (_state.value.isSending) return
        _state.value = _state.value.copy(email = email, isSending = true, errorMessage = null)

        viewModelScope.launch {
            when (val result = repository.requestPasswordReset(email)) {
                is ActionResult.Success -> {
                    _state.value = _state.value.copy(
                        isSending = false,
                        sendCount = _state.value.sendCount + 1
                    )
                    if (announce) _events.send(RecoveryEvent.CodeSent)
                }
                is ActionResult.Failure -> _state.value = _state.value.copy(
                    isSending = false,
                    errorMessage = result.message
                )
            }
        }
    }

    fun resetPassword(code: String, newPassword: String) {
        if (_state.value.isSubmitting) return
        val email = _state.value.email
        _state.value = _state.value.copy(isSubmitting = true, errorMessage = null)

        viewModelScope.launch {
            when (val result = repository.resetPassword(email, code, newPassword)) {
                is ActionResult.Success -> {
                    _state.value = _state.value.copy(isSubmitting = false)
                    _events.send(RecoveryEvent.PasswordReset)
                }
                is ActionResult.Failure -> _state.value = _state.value.copy(
                    isSubmitting = false,
                    errorMessage = result.message
                )
            }
        }
    }
}