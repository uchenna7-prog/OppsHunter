package com.oppshunter.app.features.profile.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.oppshunter.app.core.network.NetworkModule
import com.oppshunter.app.features.profile.data.ProfileRepository
import com.oppshunter.app.features.profile.data.ProfileResult
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

data class ProfileState(
    val displayName: String? = null,
    val avatarUrl: String? = null,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val errorMessage: String? = null
)

sealed interface ProfileEvent {
    object Saved : ProfileEvent
}

class ProfileViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = ProfileRepository(NetworkModule.create(application))

    private val _state = MutableStateFlow(ProfileState())
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    private val _events = Channel<ProfileEvent>(Channel.BUFFERED)
    val events: Flow<ProfileEvent> = _events.receiveAsFlow()

    fun clear() {
        _state.value = ProfileState()
    }

    fun clearError() {
        _state.value = _state.value.copy(errorMessage = null)
    }

    fun load() {
        if (_state.value.isLoading) return
        _state.value = _state.value.copy(isLoading = true)

        viewModelScope.launch {
            when (val result = repository.loadProfile()) {
                is ProfileResult.Success -> _state.value = _state.value.copy(
                    displayName = result.data.displayName,
                    avatarUrl = result.data.avatarUrl,
                    isLoading = false
                )
                is ProfileResult.Failure -> _state.value = _state.value.copy(isLoading = false)
            }
        }
    }

    fun saveDisplayName(name: String) {
        if (_state.value.isSaving) return
        _state.value = _state.value.copy(isSaving = true, errorMessage = null)

        viewModelScope.launch {
            when (val result = repository.saveDisplayName(name)) {
                is ProfileResult.Success -> {
                    _state.value = _state.value.copy(
                        displayName = result.data.displayName,
                        avatarUrl = result.data.avatarUrl,
                        isSaving = false
                    )
                    _events.send(ProfileEvent.Saved)
                }
                is ProfileResult.Failure -> _state.value = _state.value.copy(
                    isSaving = false,
                    errorMessage = result.message
                )
            }
        }
    }
}