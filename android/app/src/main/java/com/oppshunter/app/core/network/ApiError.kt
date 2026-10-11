package com.oppshunter.app.core.network

import com.google.gson.Gson

data class ApiError(val code: String, val message: String)

private data class ErrorEnvelope(val error: ErrorDetail?)

private data class ErrorDetail(val code: String?, val message: String?)

fun parseApiError(body: String?): ApiError {
    val parsed = body?.let {
        try {
            Gson().fromJson(it, ErrorEnvelope::class.java)
        } catch (e: Exception) {
            null
        }
    }

    return ApiError(
        code = parsed?.error?.code ?: "UNKNOWN_ERROR",
        message = parsed?.error?.message ?: "Something went wrong"
    )
}