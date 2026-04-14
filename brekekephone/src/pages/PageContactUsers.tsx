import { orderBy, uniq } from 'lodash'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import { SectionList, StyleSheet, View } from 'react-native'

import { mdiMagnify, mdiPhone, mdiVideo } from '#/assets/icons'
import { ContactSectionList } from '#/components/ContactSectionList'
import { UserItem } from '#/components/ContactUserItem'
import { Field } from '#/components/Field'
import { Layout } from '#/components/Layout'
import { RnText, RnTouchableOpacity } from '#/components/Rn'
import type { DemoContact } from '#/config/demoConfig'
import { DEMO_CONTACTS, DEMO_MODE, PHASE_2_ENABLED } from '#/config/demoConfig'
import type { ChatMessage } from '#/stores/chatStore'
import { ctx } from '#/stores/ctx'
import { demoStore } from '#/stores/demoStore'
import { intl } from '#/stores/intl'
import { DelayFlag } from '#/utils/DelayFlag'
import { signalingUsersService } from '#/services/signalingUsersService'
import { filterTextOnly } from '#/utils/formatChatContent'

@observer
export class PageContactUsers extends Component {
  displayOfflineUsers = new DelayFlag()

  componentDidMount = () => {
    this.componentDidUpdate()
  }

  getMatchUserIds = () => {
    const userIds = uniq([
      ...ctx.contact.pbxUsers.map(u => u.id),
      ...ctx.contact.ucUsers.map(u => u.id),
    ])
    return userIds.filter(this.isMatchUser)
  }
  resolveUser = (id: string) => {
    const pbxUser = ctx.contact.getPbxUserById(id) || {}
    const ucUser = ctx.contact.getUcUserById(id) || {}
    const u = {
      ...pbxUser,
      ...ucUser,
    }
    return u
  }
  isMatchUser = (id: string) => {
    if (!id) {
      return false
    }
    let userId = id
    let pbxUserName: string
    const pbxUser = ctx.contact.getPbxUserById(id)
    if (pbxUser) {
      pbxUserName = pbxUser.name
    } else {
      pbxUserName = ''
    }
    let ucUserName: string
    const ucUser = ctx.contact.getUcUserById(id)
    if (ucUser) {
      ucUserName = ucUser.name
    } else {
      ucUserName = ''
    }
    //
    userId = userId.toLowerCase()
    pbxUserName = pbxUserName.toLowerCase()
    ucUserName = ucUserName.toLowerCase()
    const txt = ctx.contact.usersSearchTerm.toLowerCase()
    return (
      userId.includes(txt) ||
      pbxUserName.includes(txt) ||
      ucUserName.includes(txt)
    )
  }

  componentDidUpdate = () => {
    const ca = ctx.auth.getCurrentAccount()
    if (this.displayOfflineUsers.enabled !== ca?.displayOfflineUsers) {
      this.displayOfflineUsers.setEnabled(ca?.displayOfflineUsers)
    }
  }
  getDescription = (isUserSelectionMode: boolean) => {
    const ca = ctx.auth.getCurrentAccount()
    if (!ca) {
      return ''
    }
    if (!isUserSelectionMode) {
      const allUsers = this.getMatchUserIds().map(this.resolveUser)
      const onlineUsers = allUsers.filter(
        i => i.status && i.status !== 'offline',
      )
      let desc = intl`Users, ${allUsers.length} total`
      if (allUsers.length && ca.ucEnabled) {
        desc = desc.replace(
          intl`${allUsers.length} total`,
          intl`${onlineUsers.length}/${allUsers.length} online`,
        )
      }
      return desc
    } else {
      const searchTxt = ctx.contact.usersSearchTerm.toLowerCase()
      const isShowOfflineUser =
        !ca.ucEnabled || this.displayOfflineUsers.enabled
      const { totalContact = 0, totalOnlineContact = 0 } = ctx.user.filterUser(
        searchTxt,
        isShowOfflineUser,
      )
      let desc = intl`Users, ${totalContact} total`
      if (ca.ucEnabled) {
        desc = desc.replace(
          intl`${totalContact} total`,
          intl`${totalOnlineContact}/${totalContact} online`,
        )
      }
      return desc
    }
  }
  renderUserSelectionMode = () => {
    const searchTxt = ctx.contact.usersSearchTerm.toLowerCase()
    const isShowOfflineUser =
      !ctx.auth.getCurrentAccount()?.ucEnabled ||
      this.displayOfflineUsers.enabled
    const { displayUsers } = ctx.user.filterUser(searchTxt, isShowOfflineUser)
    return <ContactSectionList sectionListData={displayUsers} />
  }
  renderAllUserMode = () => {
    const ca = ctx.auth.getCurrentAccount()
    if (!ca) {
      return null
    }
    const allUsers = this.getMatchUserIds().map(this.resolveUser)
    const onlineUsers = allUsers.filter(i => i.status && i.status !== 'offline')
    type User = (typeof allUsers)[0]
    const displayUsers =
      !this.displayOfflineUsers.enabled && ca.ucEnabled ? onlineUsers : allUsers
    const map = {} as { [k: string]: User[] }
    displayUsers.forEach(u => {
      u.name = u.name || u.id || ''
      let c0 = u.name.charAt(0).toUpperCase()
      if (!/[A-Z]/.test(c0)) {
        c0 = '#'
      }
      if (!map[c0]) {
        map[c0] = []
      }
      map[c0].push(u)
    })
    let groups = Object.keys(map).map(k => ({
      title: k,
      data: map[k],
    }))
    groups = orderBy(groups, 'title')
    groups.forEach(gr => {
      gr.data = orderBy(gr.data, 'name')
    })
    return (
      <SectionList
        sections={groups}
        keyExtractor={(item, index) => item.id}
        renderItem={({
          item,
          index,
        }: {
          item: ItemUser['item']
          index: number
        }) => <RenderItemUser item={item} index={index} />}
        renderSectionHeader={({ section: { title } }) => (
          // TODO: move to a new component with observer
          <Field isGroup label={title} />
        )}
      />
    )
  }

  render() {
    // If demo mode, show demo contacts
    if (DEMO_MODE) {
      return <DemoContactsPage />
    }

    const ca = ctx.auth.getCurrentAccount()
    if (!ca) {
      return null
    }
    const isUserSelectionMode = ctx.auth.isBigMode() || !ca.pbxLocalAllUsers
    const description = this.getDescription(isUserSelectionMode)
    return (
      <Layout
        description={description}
        dropdown={[
          {
            label: intl`Edit buddy list`,
            onPress: ctx.nav.goToPageContactEdit,
          },
        ]}
        menu='contact'
        subMenu='users'
        title={intl`Users`}
      >
        <Field
          icon={mdiMagnify}
          label={intl`SEARCH FOR USERS`}
          onValueChange={(v: string) => {
            // TODO: use debounced value to perform data filter
            ctx.contact.usersSearchTerm = v
          }}
          value={ctx.contact.usersSearchTerm}
        />
        {ctx.auth.getCurrentAccount()?.ucEnabled && (
          <Field
            label={intl`SHOW OFFLINE USERS`}
            onValueChange={(v: boolean) => {
              ctx.account.upsertAccount({
                id: ctx.auth.signedInId,
                displayOfflineUsers: v,
              })
            }}
            type='Switch'
            value={ca.displayOfflineUsers}
          />
        )}
        {isUserSelectionMode
          ? this.renderUserSelectionMode()
          : this.renderAllUserMode()}
      </Layout>
    )
  }
}

const getLastMessageChat = (id: string) => {
  const chats = filterTextOnly(ctx.chat.getMessagesByThreadId(id))
  return chats.length ? chats[chats.length - 1] : ({} as ChatMessage)
}
type ItemUser = {
  item: {
    id: string
  }
  index: number
}
const RenderItemUser = observer(({ item, index }: ItemUser) => (
  // TODO: move to a new component with observer
  <UserItem
    iconFuncs={[
      () => ctx.call.startVideoCall(item.id),
      () => ctx.call.startCall(item.id),
    ]}
    loadings
    icons={[mdiVideo, mdiPhone]}
    lastMessage={getLastMessageChat(item.id)?.text}
    {...item}
    canTouch
    onPress={
      ctx.auth.getCurrentAccount()?.ucEnabled
        ? () => ctx.nav.goToPageChatDetail({ buddy: item.id })
        : undefined
    }
  />
))

// ============================================
// Demo Mode Components
// ============================================
const demoStyles = StyleSheet.create({
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0D47A1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  callButtonText: {
    color: 'white',
    fontSize: 20,
  },
})

// Demo Contact Item Component
const DemoContactItem = observer(({ contact }: { contact: DemoContact }) => {
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const handleCall = async () => {
    if (PHASE_2_ENABLED) {
      ctx.webrtc.startCall(contact.id)
      return
    }

    // Start mock call using demoStore
    const success = await demoStore.startMockCall(contact.id)
    if (success) {
      // Navigate to call page
      ctx.nav.goToPageCallManage()
    }
  }

  return (
    <View style={demoStyles.contactItem}>
      <View style={demoStyles.avatar}>
        <RnText style={demoStyles.avatarText}>{initials}</RnText>
        {contact.isOnline && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: '#4CAF50',
              borderWidth: 2,
              borderColor: 'white',
            }}
          />
        )}
      </View>
      <View style={demoStyles.contactInfo}>
        <RnText style={demoStyles.contactName}>{contact.name}</RnText>
        <RnText style={demoStyles.contactPhone}>{contact.phone}</RnText>
      </View>
      <RnTouchableOpacity style={demoStyles.callButton} onPress={handleCall}>
        <RnText style={demoStyles.callButtonText}>Call</RnText>
      </RnTouchableOpacity>
    </View>
  )
})

// Demo Contacts Page
const DemoContactsPage = observer(() => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [contacts, setContacts] = React.useState<DemoContact[]>(DEMO_CONTACTS)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    let mounted = true

    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const ca = ctx.auth.getCurrentAccount()
        const tenant = ca?.pbxTenant
        const currentUser = demoStore.currentUser
        if (!tenant) {
          throw new Error('Missing tenant')
        }

        const users = await signalingUsersService.getTenantUsers(tenant)
        if (!mounted) {
          return
        }

        setContacts(
          users
            .filter(user => {
              if (!currentUser) {
                return true
              }

              return !(
                user.id === currentUser.id ||
                user.userName === currentUser.userName ||
                user.phone === currentUser.phone
              )
            })
            .map(user => ({
              id: user.id,
              name: user.displayName || user.userName || user.phone || user.id,
              phone: user.phone || user.id,
              isOnline:
                ctx.webrtc.onlineUsers.includes(user.id) ||
                ctx.webrtc.onlineUsers.includes(user.phone),
            })),
        )
      } catch (error) {
        console.log(
          '[PageContactUsers] Failed to load tenant users from signaling server:',
          error,
        )
        if (mounted) {
          setContacts(demoStore.contacts)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      mounted = false
    }
  }, [])

  const displayContacts = contacts.map(contact => ({
    ...contact,
    isOnline:
      ctx.webrtc.onlineUsers.includes(contact.id) ||
      ctx.webrtc.onlineUsers.includes(contact.phone),
  }))

  const filteredContacts = displayContacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm),
  )

  return (
    <Layout
      description={
        isLoading
          ? 'Loading contacts...'
          : `${filteredContacts.length} contacts`
      }
      menu='contact'
      subMenu='users'
      title='Contacts'
    >
      <Field
        icon={mdiMagnify}
        label='SEARCH CONTACTS'
        onValueChange={setSearchTerm}
        value={searchTerm}
      />
      {filteredContacts.map(contact => (
        <DemoContactItem key={contact.id} contact={contact} />
      ))}
    </Layout>
  )
})
