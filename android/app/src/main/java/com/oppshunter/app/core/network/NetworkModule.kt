package com.oppshunter.app.core.network

import android.content.Context
import com.google.gson.Gson
import com.oppshunter.app.core.storage.TokenStore
import com.oppshunter.app.features.auth.data.AuthApi
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object NetworkModule {
    private const val BASE_URL = "https://oppshunter-api-6c1e97919369.herokuapp.com"

    fun create(context: Context): AuthApi {

        val tokenStore = TokenStore(context)

        val authInterceptor = Interceptor { chain ->
            val originalRequest = chain.request()
            val accessToken = tokenStore.getAccessTokenBlocking()

            val requestBuilder = originalRequest.newBuilder()
            if (!accessToken.isNullOrBlank()) {
                requestBuilder.addHeader("Authorization", "Bearer $accessToken")
            }

            chain.proceed(requestBuilder.build())
        }

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(Gson()))
            .build()

        return retrofit.create(AuthApi::class.java)
    }
}