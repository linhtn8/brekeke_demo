import { observer } from 'mobx-react'
import { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'

import {
  mdiDotsHorizontal,
  mdiLadybug,
  mdiUnfoldMoreHorizontal,
} from '#/assets/icons'
import { AccountSignInItem } from '#/components/AccountSignInItem'
import { BapLogo } from '#/components/BapLogo'
import { BrekekeGradient } from '#/components/BrekekeGradient'
import { Layout } from '#/components/Layout'
import { RnIcon, RnText, RnTouchableOpacity } from '#/components/Rn'
import { v } from '#/components/variables'
import { currentVersion } from '#/config'
import {
  DEMO_COLORS,
  DEMO_LOGIN_SETTINGS,
  DEMO_MODE,
} from '#/config/demoConfig'
import { ctx } from '#/stores/ctx'
import { demoStore } from '#/stores/demoStore'
import { intl } from '#/stores/intl'
import { permForCall } from '#/utils/permissions'

const css = StyleSheet.create({
  PageAccountSignIn_ListServers: {
    height: '70%',
    minHeight: 320,
  },
  PageAccountSignIn_Spacing: {
    flex: 1,
    maxHeight: '20%',
  },
  Space: {
    height: 15,
  },
  CornerButton: {
    position: 'absolute',
    bottom: 0,
    paddingTop: 25,
    paddingBottom: 10,
    paddingHorizontal: 15,
    ...v.backdropZindex,
  },
  CornerButton__info: {
    left: 0,
  },
  CornerButton__language: {
    right: 0,
  },
  CornerButton_Inner: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  CornerButton_Inner__info: {
    paddingLeft: 19,
  },
  CornerButton_Inner__language: {
    paddingRight: 18,
  },
  CornerButton_Icon: {
    position: 'absolute',
    ...Platform.select({
      android: {
        top: 4,
      },
      default: {
        top: 2,
      },
    }),
  },
  CornerButton_Icon__info: {
    left: 0,
  },
  CornerButton_Icon__language: {
    right: 0,
  },
  // Demo login styles
  demoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  demoLogoContainer: {
    marginBottom: 50,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
  },
  demoInputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  demoInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  demoButton: {
    backgroundColor: DEMO_COLORS.primaryDark,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  demoButtonDisabled: {
    opacity: 0.7,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoLoadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 20,
  },
})

// Demo Login Component
const DemoLogin = observer(() => {
  const [username, setUsername] = useState(DEMO_LOGIN_SETTINGS.defaultUsername)
  const [password, setPassword] = useState(DEMO_LOGIN_SETTINGS.defaultPassword)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async () => {
    try {
      setErrorMessage('')
      await demoStore.login(username, password, () => {
        ctx.nav.goToPageContactUsers()
      })
    } catch (error: any) {
      const message = error?.message || 'Sign in failed'
      setErrorMessage(message)
      ctx.toast.error({ err: new Error(message) })
    }
  }

  // Show loading spinner
  if (demoStore.isLoading) {
    return (
      <BrekekeGradient>
        <View style={css.demoLoadingContainer}>
          <BapLogo size={100} />
          <ActivityIndicator
            size='large'
            color='white'
            style={{ marginTop: 30 }}
          />
          <RnText style={css.demoLoadingText}>Signing in...</RnText>
        </View>
      </BrekekeGradient>
    )
  }

  return (
    <BrekekeGradient>
      <View style={css.demoContainer}>
        <View style={css.demoLogoContainer}>
          <BapLogo size={120} />
          <RnText style={css.demoTitle}>BAP Phone</RnText>
        </View>

        <View style={css.demoInputContainer}>
          <TextInput
            style={css.demoInput}
            placeholder='Username'
            placeholderTextColor='#999'
            value={username}
            onChangeText={setUsername}
            autoCapitalize='none'
            autoCorrect={false}
          />
          <TextInput
            style={css.demoInput}
            placeholder='Password'
            placeholderTextColor='#999'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <RnTouchableOpacity
            style={[
              css.demoButton,
              (!username || !password) && css.demoButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!username || !password}
          >
            <RnText style={css.demoButtonText}>Sign In</RnText>
          </RnTouchableOpacity>
          {!!errorMessage && (
            <RnText style={{ color: 'white', marginTop: 12, textAlign: 'center' }}>
              {errorMessage}
            </RnText>
          )}
        </View>
      </View>

      {/* Version info at bottom */}
      <RnTouchableOpacity
        onPress={ctx.nav.goToPageSettingsDebug}
        style={css.CornerButton}
      >
        <View style={[css.CornerButton_Inner, css.CornerButton_Inner__info]}>
          <RnIcon
            color='white'
            path={mdiLadybug}
            size={16}
            style={[css.CornerButton_Icon, css.CornerButton_Icon__info]}
          />
          <RnText bold white>
            {currentVersion} (Demo)
          </RnText>
        </View>
      </RnTouchableOpacity>
      <View style={css.Space} />
    </BrekekeGradient>
  )
})

export const PageAccountSignIn = observer(() => {
  // If demo mode, show demo login
  if (DEMO_MODE) {
    return <DemoLogin />
  }

  // Original Brekeke login
  const ids = ctx.account.accounts.map(a => a.id).filter(id => id)
  const l = ids.length
  const createAccount = async () => {
    if (!(await permForCall(true))) {
      return
    }
    ctx.nav.goToPageAccountCreate()
  }
  return (
    <BrekekeGradient>
      <Layout
        description={intl`${l} accounts in total`}
        noScroll
        onCreate={!!l ? createAccount : undefined}
        title={intl`Accounts`}
        transparent
      >
        <View
          style={{
            flexDirection: 'column',
            width: '100%',
            justifyContent: 'space-around',
          }}
        ></View>
        <View style={css.PageAccountSignIn_Spacing} />
        {!l ? (
          <AccountSignInItem empty />
        ) : (
          <FlatList
            data={ids}
            horizontal
            keyExtractor={(id: string) => id}
            renderItem={({ index, item }) => (
              <AccountSignInItem id={item} last={index === l - 1} />
            )}
            showsHorizontalScrollIndicator={false}
            style={css.PageAccountSignIn_ListServers}
          />
        )}
      </Layout>
      <RnTouchableOpacity
        onPress={ctx.nav.goToPageSettingsDebug}
        style={css.CornerButton}
      >
        <View style={[css.CornerButton_Inner, css.CornerButton_Inner__info]}>
          <RnIcon
            color='white'
            path={mdiLadybug}
            size={16}
            style={[css.CornerButton_Icon, css.CornerButton_Icon__info]}
          />
          <RnText bold white>
            {currentVersion}
          </RnText>
        </View>
      </RnTouchableOpacity>
      <RnTouchableOpacity
        onPress={ctx.intl.localeLoading ? undefined : ctx.intl.selectLocale}
        style={[css.CornerButton, css.CornerButton__language]}
      >
        <View
          style={[css.CornerButton_Inner, css.CornerButton_Inner__language]}
        >
          <RnText bold white>
            {ctx.intl.localeLoading ? '\u200a' : ctx.intl.getLocaleName()}
          </RnText>
          <RnIcon
            color='white'
            path={
              ctx.intl.localeLoading
                ? mdiDotsHorizontal
                : mdiUnfoldMoreHorizontal
            }
            size={16}
            style={[css.CornerButton_Icon, css.CornerButton_Icon__language]}
          />
        </View>
      </RnTouchableOpacity>
      <View style={css.Space} />
    </BrekekeGradient>
  )
})
