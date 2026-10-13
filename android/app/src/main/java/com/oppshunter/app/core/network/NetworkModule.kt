package com.oppshunter.app.core.network

import android.content.Context
import android.content.pm.ApplicationInfo
import com.google.gson.Gson
import com.oppshunter.app.core.storage.TokenStore
import com.oppshunter.app.features.auth.data.AuthApi
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object NetworkModule {
    private const val BASE_URL = "https://oppshunter-api-6c1e97919369.herokuapp.com/"

    private val PUBLIC_PATHS = listOf(
        "/auth/login",
        "/auth/register",
        "/auth/google",
        "/auth/refresh",
        "/auth/password-reset"
    )

    @Volatile
    private var instance: Retrofit? = null

    fun retrofit(context: Context): Retrofit {
        return instance ?: synchronized(this) {
            instance ?: build(context.applicationContext).also { instance = it }
        }
    }

    inline fun <reified T> create(context: Context): T {
        return retrofit(context).create(T::class.java)
    }

    private fun build(context: Context): Retrofit {
        val tokenStore = TokenStore(context)
        val gson = Gson()

        val refreshApi = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(OkHttpClient.Builder().build())
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(AuthApi::class.java)

        val authInterceptor = Interceptor { chain ->
            val request = chain.request()
            val path = request.url.encodedPath
            val accessToken = tokenStore.getAccessTokenBlocking()

            if (PUBLIC_PATHS.any { path.startsWith(it) } || accessToken.isNullOrBlank()) {
                chain.proceed(request)
            } else {
                chain.proceed(
                    request.newBuilder()
                        .header("Authorization", "Bearer $accessToken")
                        .build()
                )
            }
        }

        val isDebuggable = (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            redactHeader("Authorization")
            level = if (isDebuggable) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .authenticator(TokenAuthenticator(tokenStore, refreshApi))
            .addInterceptor(loggingInterceptor)
            .build()

        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }
}