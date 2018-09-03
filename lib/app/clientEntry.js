/* global BASE_URL, GA_ID, ga, FBQ_ID, fbq, SW_ENABLED, VUEPRESS_VERSION, LAST_COMMIT_HASH*/

import { createApp } from './app'
import SWUpdateEvent from './SWUpdateEvent'
import { register } from 'register-service-worker'

const { app, router } = createApp()

window.__VUEPRESS_VERSION__ = {
  version: VUEPRESS_VERSION,
  hash: LAST_COMMIT_HASH
}

if (process.env.NODE_ENV === 'production') {
  // Google analytics integration
  if (GA_ID) {
    (function (i, s, o, g, r, a, m) {
      i['GoogleAnalyticsObject'] = r
      i[r] = i[r] || function () {
        (i[r].q = i[r].q || []).push(arguments)
      }
      i[r].l = 1 * new Date()
      a = s.createElement(o)
      m = s.getElementsByTagName(o)[0]
      a.async = 1
      a.src = g
      m.parentNode.insertBefore(a, m)
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga')

    ga('create', GA_ID, 'auto')
    ga('send', 'pageview')

    router.afterEach(function (to) {
      ga('set', 'page', to.fullPath)
      ga('send', 'pageview')
    })
  }

  // Facebook pixel integration
  if (FBQ_ID) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return
      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = !0
      n.version = '2.0'
      n.queue = []
      t = b.createElement(e)
      t.async = !0
      t.src = v
      s = b.getElementsByTagName(e)[0]
      s.parentNode.insertBefore(t, s)
    }(window,
      document, 'script', 'https://connect.facebook.net/en_US/fbevents.js'))
    fbq('init', FBQ_ID)
    fbq('track', 'PageView')
    router.afterEach(function (to) {
      fbq('track', 'PageView')
    })
  }
}

router.onReady(() => {
  app.$mount('#app')

  // Register service worker
  if (process.env.NODE_ENV === 'production' &&
    SW_ENABLED &&
    window.location.protocol === 'https:') {
    register(`${BASE_URL}service-worker.js`, {
      ready () {
        console.log('[vuepress:sw] Service worker is active.')
        app.$refs.layout.$emit('sw-ready')
      },
      cached (registration) {
        console.log('[vuepress:sw] Content has been cached for offline use.')
        app.$refs.layout.$emit('sw-cached', new SWUpdateEvent(registration))
      },
      updated (registration) {
        console.log('[vuepress:sw] Content updated.')
        app.$refs.layout.$emit('sw-updated', new SWUpdateEvent(registration))
      },
      offline () {
        console.log('[vuepress:sw] No internet connection found. App is running in offline mode.')
        app.$refs.layout.$emit('sw-offline')
      },
      error (err) {
        console.error('[vuepress:sw] Error during service worker registration:', err)
        app.$refs.layout.$emit('sw-error', err)
        if (GA_ID) {
          ga('send', 'exception', {
            exDescription: err.message,
            exFatal: false
          })
        }
      }
    })
  }
})
