import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  Ticket,
  PlusCircle,
  Trash2,
  Eye,
  EyeOff,
  Server,
  RefreshCw,
  Check,
  Clock,
  Globe,
  User,
  Users,
  Lock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Phone,
  Link,
  MessageCircle,
  Sliders,
  Settings,
  Loader2,
  X,
  Bot,
  Key,
  Hash,
  FileText,
  Play,
  AlertTriangle,
  LogOut,
  KeyRound,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { ProviderDispatchConfig, ProviderTicketItem, ProviderTelegramItem, ProviderWhatsAppItem, DispatchMethod } from '../../types';
import { Select2, Select2Option } from '../ui/Select2';

export const DispatchConfigPage: React.FC = () => {
  const { panels, addToast, language } = useApp();

  // Selected Panel for configuration
  const [selectedPanelId, setSelectedPanelId] = useState<string>(panels[0]?.id || '');
  const currentPanel = panels.find((p) => p.id === selectedPanelId) || panels[0];

  // Active channel tab: 'ticket' | 'telegram' | 'whatsapp'
  const [activeMethod, setActiveMethod] = useState<DispatchMethod>('ticket');

  // Dispatch global enable toggle
  const [enabled, setEnabled] = useState<boolean>(true);
  const [autoCreateOnOrder, setAutoCreateOnOrder] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // 1. TICKET CHANNEL (Hỗ trợ cấu hình nhiều Domain NCC khác nhau)
  const [providers, setProviders] = useState<ProviderTicketItem[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isAddingNewProvider, setIsAddingNewProvider] = useState(false);
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<string, boolean>>({});

  // Form Ticket Scanner / Inspector state
  const [editingProvider, setEditingProvider] = useState<ProviderTicketItem | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editSubcategory, setEditSubcategory] = useState<string>('');
  const [editEnabled, setEditEnabled] = useState<boolean>(true);
  const [testOrderId, setTestOrderId] = useState<string>('123456');
  const [isSendingTestTicket, setIsSendingTestTicket] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isScanningForm, setIsScanningForm] = useState<boolean>(false);
  const [scannedCategoriesTree, setScannedCategoriesTree] = useState<Array<{
    value: string;
    text: string;
    subcategories: Array<{ value: string; text: string }>;
    dynamicFields?: Array<{ name: string; label: string }>;
  }>>([]);
  const [scannedCategories, setScannedCategories] = useState<Array<{ value: string; text: string }>>([]);
  const [scannedSubcategories, setScannedSubcategories] = useState<Array<{ value: string; text: string }>>([]);
  const [scannedDynamicFields, setScannedDynamicFields] = useState<Array<{ name: string; label: string }>>([]);

  // 2. TELEGRAM CHANNEL (Telethon User + Cấu hình nhiều Domain NCC)
  const [tgMode, setTgMode] = useState<'telethon' | 'bot'>('telethon');
  const [tgApiId, setTgApiId] = useState<string>('');
  const [tgApiHash, setTgApiHash] = useState<string>('');
  const [tgSessionName, setTgSessionName] = useState<string>('telegram_user.session');
  const [tgTarget, setTgTarget] = useState<string>('');
  const [tgDefaultMessage, setTgDefaultMessage] = useState<string>('');
  const [tgTargetType, setTgTargetType] = useState<'user' | 'group'>('user');
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgUserPhone, setTgUserPhone] = useState('');
  const [tgUserUsername, setTgUserUsername] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [tgGroupUsername, setTgGroupUsername] = useState('');
  const [tgThreadId, setTgThreadId] = useState('');
  const [showTgToken, setShowTgToken] = useState(false);

  // Telegram Auth States (Telethon Login Flow)
  const [tgAuthUser, setTgAuthUser] = useState<any>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('smm_tg_auth_user') : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [tgAuthStatus, setTgAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized' | 'error'>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('smm_tg_auth_user') : null;
      return saved ? 'authorized' : 'unauthorized';
    } catch {
      return 'unauthorized';
    }
  });
  const [tgAuthPhone, setTgAuthPhone] = useState<string>('');
  const [tgAuthCode, setTgAuthCode] = useState<string>('');
  const [tgAuthPassword, setTgAuthPassword] = useState<string>('');
  const [tgPhoneCodeHash, setTgPhoneCodeHash] = useState<string>('');
  const [tgCodeSent, setTgCodeSent] = useState<boolean>(false);
  const [tgNeeds2Fa, setTgNeeds2Fa] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  const [tgAuthMessage, setTgAuthMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Telegram Test State
  const [isSendingTgTest, setIsSendingTgTest] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tgTestTarget, setTgTestTarget] = useState('');
  const [tgTestMessage, setTgTestMessage] = useState('');

  // 3. WHATSAPP CHANNEL (Send-Whatsapp / whatsapp-web.js: User / Invite Link / Group JID)
  const [waTargetType, setWaTargetType] = useState<'user' | 'invite' | 'group'>('user');
  const [waGatewayUrl, setWaGatewayUrl] = useState('');
  const [waApiKey, setWaApiKey] = useState('');
  const [waInstanceId, setWaInstanceId] = useState('');
  const [waUserPhone, setWaUserPhone] = useState('');
  const [waGroupLink, setWaGroupLink] = useState('');
  const [waGroupId, setWaGroupId] = useState('');
  const [waDefaultMessage, setWaDefaultMessage] = useState('');
  const [waAuthStatus, setWaAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized' | 'error'>('checking');
  const [isSendingWaTest, setIsSendingWaTest] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [waTestTarget, setWaTestTarget] = useState('');
  const [waTestMessage, setWaTestMessage] = useState('');
  const [showWaKey, setShowWaKey] = useState(false);

  // WhatsApp QR Login Modal State
  const [showWaLoginModal, setShowWaLoginModal] = useState(false);
  const [waLoginState, setWaLoginState] = useState<'idle' | 'starting' | 'qr' | 'authenticated' | 'ready' | 'error'>('idle');
  const [waQrDataUrl, setWaQrDataUrl] = useState('');
  const [waLoginMessage, setWaLoginMessage] = useState('');
  const [waLoginError, setWaLoginError] = useState('');
  const [waLoginPercent, setWaLoginPercent] = useState(0);
  const waLoginPollTimer = useRef<any>(null);

  // Direct Message Sending Form
  const [targetProviderId, setTargetProviderId] = useState<string>('');
  const [targetProviderDomain, setTargetProviderDomain] = useState<string>('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Dispatch Log History
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);

  // Load existing panel dispatch config when currentPanel changes
  useEffect(() => {
    if (currentPanel) {
      fetch(`/api/panels/${currentPanel.id}/dispatch-config`)
        .then((r) => r.json())
        .then(({ data }) => {
          if (data) {
            setEnabled(data.enabled !== false);
            if (data.method) setActiveMethod(data.method);

            // Load Ticket config
            if (data.ticket) {
              if (Array.isArray(data.ticket.providers) && data.ticket.providers.length > 0) {
                const formatted = data.ticket.providers.map((p: any) => ({
                  ...p,
                  id: p.domain || `prov-${p.username}`,
                }));
                setProviders(formatted);
                setTargetProviderId(formatted[0]?.id || '');
                setTargetProviderDomain(formatted[0]?.domain || '');
              } else if (data.ticket.loginUrl || data.ticket.domain) {
                const cleanDom = (data.ticket.loginUrl || data.ticket.domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                if (cleanDom) {
                  const singleItem: ProviderTicketItem = {
                    id: cleanDom,
                    domain: cleanDom,
                    username: data.ticket.username || '',
                    password: data.ticket.password || '',
                    enabled: true,
                  };
                  setProviders([singleItem]);
                  setTargetProviderId(singleItem.id);
                  setTargetProviderDomain(cleanDom);
                } else {
                  setProviders([]);
                  setTargetProviderId('');
                  setTargetProviderDomain('');
                }
              } else {
                setProviders([]);
                setTargetProviderId('');
                setTargetProviderDomain('');
              }
              if (typeof data.ticket.autoCreateOnOrder === 'boolean') {
                setAutoCreateOnOrder(data.ticket.autoCreateOnOrder);
              }
            } else {
              setProviders([]);
              setTargetProviderId('');
              setTargetProviderDomain('');
            }

            // Load Telegram config
            if (data.telegram) {
              if (data.telegram.mode) setTgMode(data.telegram.mode);
              if (data.telegram.apiId) setTgApiId(String(data.telegram.apiId));
              if (data.telegram.apiHash) setTgApiHash(data.telegram.apiHash);
              if (data.telegram.sessionName) setTgSessionName(data.telegram.sessionName);
              if (data.telegram.target) {
                setTgTarget(data.telegram.target);
                setTgTestTarget(data.telegram.target);
              }
              if (data.telegram.defaultMessage) {
                setTgDefaultMessage(data.telegram.defaultMessage);
                setTgTestMessage(data.telegram.defaultMessage);
              }
              if (data.telegram.authUser) {
                setTgAuthUser(data.telegram.authUser);
                setTgAuthStatus('authorized');
                try { localStorage.setItem('smm_tg_auth_user', JSON.stringify(data.telegram.authUser)); } catch {}
              }
              if (data.telegram.targetType) setTgTargetType(data.telegram.targetType);
              setTgBotToken(data.telegram.botToken || '');
              setTgUserPhone(data.telegram.userPhone || '');
              setTgUserUsername(data.telegram.userUsername || '');
              setTgChatId(data.telegram.chatId || '');
              setTgGroupUsername(data.telegram.groupUsername || '');
              setTgThreadId(data.telegram.threadId || '');
            } else {
              setTgMode('telethon');
              setTgApiId('');
              setTgApiHash('');
              setTgSessionName('telegram_user.session');
              setTgTarget('');
              setTgTestTarget('');
              setTgDefaultMessage('');
              setTgTestMessage('');
              setTgBotToken('');
              setTgUserPhone('');
              setTgUserUsername('');
              setTgChatId('');
              setTgGroupUsername('');
              setTgThreadId('');
            }

            // Load WhatsApp config
            if (data.whatsapp) {
              const targetType = data.whatsapp.targetType || 'user';
              setWaTargetType(targetType);
              setWaGatewayUrl(data.whatsapp.gatewayUrl || '');
              setWaApiKey(data.whatsapp.apiKey || '');
              setWaInstanceId(data.whatsapp.instanceId || '');
              setWaUserPhone(data.whatsapp.userPhone || data.whatsapp.recipientPhone || '');
              setWaGroupLink(data.whatsapp.groupLink || data.whatsapp.groupInvite || '');
              setWaGroupId(data.whatsapp.groupId || data.whatsapp.groupName || '');
              if (data.whatsapp.defaultMessage) {
                setWaDefaultMessage(data.whatsapp.defaultMessage);
                setWaTestMessage(data.whatsapp.defaultMessage);
              }
              const defaultWaTarget = targetType === 'invite'
                ? (data.whatsapp.groupLink || data.whatsapp.groupInvite || '')
                : targetType === 'group'
                ? (data.whatsapp.groupId || data.whatsapp.groupName || '')
                : (data.whatsapp.userPhone || data.whatsapp.recipientPhone || '');
              if (defaultWaTarget) setWaTestTarget(defaultWaTarget);
            } else {
              setWaGatewayUrl('');
              setWaApiKey('');
              setWaInstanceId('');
              setWaUserPhone('');
              setWaGroupLink('');
              setWaGroupId('');
              setWaDefaultMessage('');
              setWaTestMessage('');
              setWaTestTarget('');
            }
          } else {
            // Reset to empty state when no config exists
            setProviders([]);
            setTargetProviderId('');
            setTargetProviderDomain('');
            setTgMode('telethon');
            setTgApiId('');
            setTgApiHash('');
            setTgSessionName('telegram_user.session');
            setTgTarget('');
            setTgTestTarget('');
            setTgDefaultMessage('');
            setTgTestMessage('');
            setTgBotToken('');
            setTgUserPhone('');
            setTgUserUsername('');
            setTgChatId('');
            setTgGroupUsername('');
            setTgThreadId('');
            setWaGatewayUrl('');
            setWaApiKey('');
            setWaInstanceId('');
            setWaUserPhone('');
            setWaGroupLink('');
            setWaGroupId('');
            setWaDefaultMessage('');
            setWaTestMessage('');
            setWaTestTarget('');
          }
        })
        .catch(() => {
          setProviders([]);
          setTargetProviderId('');
          setTargetProviderDomain('');
        });
    }
  }, [currentPanel?.id]);

  useEffect(() => {
    if (currentPanel?.id && activeMethod === 'telegram') {
      handleCheckTelegramAuth(true);
    }
  }, [currentPanel?.id, activeMethod, tgMode]);

  useEffect(() => {
    if (currentPanel?.id && activeMethod === 'whatsapp') {
      handleCheckWhatsappAuth(true);
    }
  }, [currentPanel?.id, activeMethod]);

  useEffect(() => {
    if (providers.length > 0 && !targetProviderId) {
      setTargetProviderId(providers[0].id);
    }
  }, [providers]);

  // Save full configuration to MySQL
  const handleSaveConfig = async (
    customProviders?: ProviderTicketItem[],
    customTgProviders?: ProviderTelegramItem[],
    customWaProviders?: ProviderWhatsAppItem[]
  ) => {
    if (!currentPanel) return;
    setSaving(true);

    const providerList = (customProviders || providers).map((p) => {
      const { id, ...cleanProv } = p;
      return cleanProv;
    });
    const firstProvider = providerList[0];

    const newDispatchConfig: ProviderDispatchConfig = {
      enabled,
      method: activeMethod,
      ticket: {
        providers: providerList,
        loginUrl: firstProvider?.domain || '',
        username: firstProvider?.username || '',
        password: firstProvider?.password || '',
        autoCreateOnOrder,
      },
      telegram: {
        mode: tgMode,
        apiId: tgApiId ? Number(tgApiId) : 38320450,
        apiHash: tgApiHash || 'b6003998510ed054f3ba9dee4a258fce',
        sessionName: tgSessionName || 'telegram_user.session',
        target: tgTarget || '@smmtop_com',
        defaultMessage: tgDefaultMessage || 'Xin chào bạn mình đến từ naplike.com',
        targetType: tgTargetType,
        authUser: tgAuthUser,
        botToken: tgBotToken,
        userPhone: tgUserPhone,
        userUsername: tgUserUsername,
        chatId: tgChatId,
        groupUsername: tgGroupUsername,
        threadId: tgThreadId,
        autoCreateOnOrder,
      },
      whatsapp: {
        targetType: waTargetType,
        userPhone: waUserPhone,
        groupLink: waGroupLink,
        groupId: waGroupId,
        defaultMessage: waDefaultMessage || 'Xin chào bạn mình đến từ naplike.com',
        gatewayUrl: waGatewayUrl,
        apiKey: waApiKey,
        instanceId: waInstanceId,
        autoCreateOnOrder,
      },
    };

    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/dispatch-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify(newDispatchConfig),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', language === 'vi' ? `Đã lưu cấu hình gửi tin nhắn cho panel ${currentPanel.name} thành công!` : `Configuration saved for ${currentPanel.name}!`);
      }
    } catch (e) {
      addToast('error', language === 'vi' ? 'Không thể lưu cấu hình.' : 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Test Send Telegram Message (Telethon or Bot)
  const handleTestTelegramSend = async () => {
    if (!currentPanel) return;
    setIsSendingTgTest(true);
    setTgTestResult(null);

    const payload = {
      mode: tgMode,
      apiId: tgApiId ? Number(tgApiId) : 38320450,
      apiHash: tgApiHash || 'b6003998510ed054f3ba9dee4a258fce',
      sessionName: tgSessionName || 'telegram_user.session',
      target: tgTestTarget.trim() || tgTarget.trim() || (tgMode === 'bot' ? tgChatId : '@smmtop_com'),
      message: tgTestMessage.trim() || tgDefaultMessage.trim() || 'Xin chào bạn mình đến từ naplike.com',
      botToken: tgBotToken.trim(),
      chatId: tgChatId.trim(),
    };

    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/test-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setTgTestResult({ success: true, message: data.message || 'Gửi tin nhắn Telegram thành công!' });
        addToast('success', data.message || 'Gửi Telegram thành công!');
      } else {
        if (data.needsAuth || (data.message && data.message.includes('chưa được đăng nhập'))) {
          setTgAuthStatus('unauthorized');
          setTgAuthUser(null);
          try { localStorage.removeItem('smm_tg_auth_user'); } catch {}
          setTgAuthMessage({
            type: 'error',
            text: data.message || 'Tài khoản Telegram chưa được đăng nhập. Vui lòng nhập số điện thoại để nhận mã xác thực.',
          });
        }
        setTgTestResult({ success: false, message: data.message || 'Lỗi gửi tin nhắn Telegram.' });
        addToast('error', data.message || 'Gửi Telegram thất bại.');
      }
    } catch (e: any) {
      setTgTestResult({ success: false, message: e.message || 'Lỗi kết nối máy chủ.' });
      addToast('error', e.message || 'Lỗi kết nối.');
    } finally {
      setIsSendingTgTest(false);
    }
  };

  // Check Telegram Telethon Auth Status
  const handleCheckTelegramAuth = async (silent: boolean = false) => {
    if (!currentPanel) return;
    if (!silent && !tgAuthUser) {
      setTgAuthStatus('checking');
    }
    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/telegram/auth-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiId: tgApiId ? Number(tgApiId) : 38320450,
          apiHash: tgApiHash || 'b6003998510ed054f3ba9dee4a258fce',
          sessionName: tgSessionName || 'telegram_user.session',
        }),
      });
      const data = await res.json();
      if (data.status === 'authorized') {
        setTgAuthStatus('authorized');
        setTgAuthUser(data.user);
        setTgCodeSent(false);
        setTgNeeds2Fa(false);
        try { localStorage.setItem('smm_tg_auth_user', JSON.stringify(data.user || { is_authorized: true })); } catch {}
      } else {
        setTgAuthStatus('unauthorized');
        setTgAuthUser(null);
        try { localStorage.removeItem('smm_tg_auth_user'); } catch {}
      }
    } catch {
      if (!silent) {
        setTgAuthStatus('unauthorized');
      }
    }
  };

  // Send Login Verification Code to Phone
  const handleTelegramSendCode = async () => {
    if (!currentPanel || !tgAuthPhone.trim()) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập số điện thoại (+84...)' : 'Please enter phone number');
      return;
    }
    setIsSendingCode(true);
    setTgAuthMessage(null);
    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/telegram/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: tgAuthPhone.trim(),
          apiId: tgApiId ? Number(tgApiId) : 38320450,
          apiHash: tgApiHash || 'b6003998510ed054f3ba9dee4a258fce',
          sessionName: tgSessionName || 'telegram_user.session',
        }),
      });
      const data = await res.json();
      if (data.success && data.status === 'code_sent') {
        setTgCodeSent(true);
        setTgPhoneCodeHash(data.phone_code_hash);
        setTgAuthMessage({ type: 'info', text: data.message || 'Please enter the code you received:' });
        addToast('success', data.message || 'Mã xác thực đã được gửi tới Telegram!');
      } else if (data.status === 'already_authorized') {
        setTgAuthStatus('authorized');
        setTgAuthUser(data.user);
        setTgCodeSent(false);
        try { localStorage.setItem('smm_tg_auth_user', JSON.stringify(data.user || { is_authorized: true })); } catch {}
        addToast('success', 'Tài khoản đã được đăng nhập!');
      } else {
        setTgAuthMessage({ type: 'error', text: data.message || 'Không thể gửi mã xác nhận.' });
        addToast('error', data.message || 'Gửi mã thất bại.');
      }
    } catch (e: any) {
      setTgAuthMessage({ type: 'error', text: e.message || 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsSendingCode(false);
    }
  };

  // Verify Code & Sign In (or 2FA)
  const handleTelegramSignIn = async () => {
    if (!currentPanel) return;
    if (!tgNeeds2Fa && !tgAuthCode.trim()) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập mã xác thực bạn nhận được.' : 'Please enter verification code.');
      return;
    }
    if (tgNeeds2Fa && !tgAuthPassword.trim()) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập mật khẩu 2FA.' : 'Please enter 2FA password.');
      return;
    }

    setIsVerifyingCode(true);
    setTgAuthMessage(null);
    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/telegram/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: tgAuthPhone.trim(),
          code: tgAuthCode.trim(),
          phoneCodeHash: tgPhoneCodeHash,
          password: tgAuthPassword.trim(),
          apiId: tgApiId ? Number(tgApiId) : 38320450,
          apiHash: tgApiHash || 'b6003998510ed054f3ba9dee4a258fce',
          sessionName: tgSessionName || 'telegram_user.session',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTgAuthStatus('authorized');
        setTgAuthUser(data.user);
        setTgCodeSent(false);
        setTgNeeds2Fa(false);
        setTgAuthCode('');
        setTgAuthPassword('');
        setTgAuthMessage({ type: 'success', text: data.message || 'Đăng nhập Telegram thành công!' });
        addToast('success', data.message || 'Đăng nhập Telegram thành công!');
        try { localStorage.setItem('smm_tg_auth_user', JSON.stringify(data.user || { is_authorized: true })); } catch {}
      } else if (data.needsPassword) {
        setTgNeeds2Fa(true);
        setTgAuthMessage({ type: 'info', text: data.message || 'Vui lòng nhập mật khẩu 2FA (Cloud Password):' });
      } else {
        setTgAuthMessage({ type: 'error', text: data.message || 'Mã xác thực không hợp lệ.' });
        addToast('error', data.message || 'Xác thực thất bại.');
      }
    } catch (e: any) {
      setTgAuthMessage({ type: 'error', text: e.message || 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Delete Telegram Session File & Reset Auth State
  const handleTelegramDeleteSession = async () => {
    if (!currentPanel) return;
    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/telegram/delete-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiId: tgApiId ? Number(tgApiId) : 38320450,
          apiHash: tgApiHash || 'b6003998510ed054f3ba9dee4a258fce',
          sessionName: tgSessionName || 'telegram_user.session',
        }),
      });
      const data = await res.json();
      setTgAuthStatus('unauthorized');
      setTgAuthUser(null);
      setTgCodeSent(false);
      setTgNeeds2Fa(false);
      setTgAuthPhone('');
      setTgAuthCode('');
      setTgAuthPassword('');
      setTgPhoneCodeHash('');
      setTgAuthMessage(null);
      try { localStorage.removeItem('smm_tg_auth_user'); } catch {}
      addToast('success', data.message || 'Đã xóa file telegram_user.session và làm mới phiên thành công!');
    } catch {
      addToast('error', 'Lỗi xóa file session.');
    }
  };

  const handleTelegramLogout = handleTelegramDeleteSession;

  // --- WHATSAPP (SEND-WHATSAPP / WHATSAPP-WEB.JS) HANDLERS ---
  const handleCheckWhatsappAuth = async (silent: boolean = false) => {
    if (!currentPanel) return;
    if (!silent) setWaAuthStatus('checking');
    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/whatsapp/auth-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'authorized' || data.success) {
        setWaAuthStatus('authorized');
        if (!silent) addToast('success', data.message || 'Phiên WhatsApp (.wwebjs_auth) đang hoạt động.');
      } else {
        setWaAuthStatus('unauthorized');
        if (!silent) addToast('info', 'Chưa có phiên đăng nhập WhatsApp.');
      }
    } catch {
      setWaAuthStatus('unauthorized');
    }
  };

  const handleDeleteWhatsappSession = async () => {
    if (!currentPanel) return;
    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/whatsapp/delete-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setWaAuthStatus('unauthorized');
      addToast('success', data.message || 'Đã xóa phiên đăng nhập WhatsApp (.wwebjs_auth).');
    } catch {
      addToast('error', 'Lỗi khi xóa phiên đăng nhập WhatsApp.');
    }
  };

  const handleStartWhatsappLogin = async () => {
    if (!currentPanel) return;
    setShowWaLoginModal(true);
    setWaLoginState('starting');
    setWaQrDataUrl('');
    setWaLoginMessage(language === 'vi' ? 'Đang khởi tạo trình duyệt Chrome & kết nối WhatsApp...' : 'Initializing Chrome & WhatsApp...');
    setWaLoginError('');
    setWaLoginPercent(0);

    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/whatsapp/start-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
      });
      const data = await res.json();
      if (data.data) {
        setWaLoginState(data.data.state || 'starting');
        if (data.data.qrDataUrl) setWaQrDataUrl(data.data.qrDataUrl);
        if (data.data.message) setWaLoginMessage(data.data.message);
      }

      // Start polling status
      if (waLoginPollTimer.current) clearInterval(waLoginPollTimer.current);
      waLoginPollTimer.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/panels/${currentPanel.id}/whatsapp/login-status`);
          const statusData = await statusRes.json();
          if (statusData.data) {
            const curState = statusData.data.state;
            setWaLoginState(curState);
            if (statusData.data.qrDataUrl) setWaQrDataUrl(statusData.data.qrDataUrl);
            if (statusData.data.message) setWaLoginMessage(statusData.data.message);
            if (statusData.data.error) setWaLoginError(statusData.data.error);
            if (typeof statusData.data.percent === 'number') setWaLoginPercent(statusData.data.percent);

            if (curState === 'ready') {
              clearInterval(waLoginPollTimer.current);
              setWaAuthStatus('authorized');
              addToast('success', language === 'vi' ? 'Đăng nhập WhatsApp thành công!' : 'WhatsApp login successful!');
              setTimeout(() => {
                setShowWaLoginModal(false);
                handleCheckWhatsappAuth(true);
              }, 2500);
            } else if (curState === 'error') {
              clearInterval(waLoginPollTimer.current);
            }
          }
        } catch {}
      }, 1500);
    } catch (e: any) {
      setWaLoginState('error');
      setWaLoginError(e.message || 'Lỗi khởi chạy đăng nhập WhatsApp');
    }
  };

  const handleCancelWhatsappLogin = async () => {
    if (waLoginPollTimer.current) {
      clearInterval(waLoginPollTimer.current);
      waLoginPollTimer.current = null;
    }
    setShowWaLoginModal(false);
    if (!currentPanel) return;
    try {
      await fetch(`/api/panels/${currentPanel.id}/whatsapp/cancel-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      handleCheckWhatsappAuth(true);
    } catch {}
  };

  const handleTestWhatsappSend = async () => {
    if (!currentPanel) return;
    setIsSendingWaTest(true);
    setWaTestResult(null);

    const targetVal = waTestTarget.trim() || (waTargetType === 'invite' ? waGroupLink.trim() : waTargetType === 'group' ? waGroupId.trim() : waUserPhone.trim());
    const payload = {
      targetType: waTargetType,
      to: waTargetType === 'user' ? targetVal : '',
      userPhone: waTargetType === 'user' ? targetVal : '',
      group: waTargetType === 'group' ? targetVal : '',
      groupId: waTargetType === 'group' ? targetVal : '',
      invite: waTargetType === 'invite' ? targetVal : '',
      groupLink: waTargetType === 'invite' ? targetVal : '',
      message: waTestMessage.trim() || waDefaultMessage.trim() || 'Xin chào bạn mình đến từ naplike.com',
    };

    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/test-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-App-Language': language },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setWaTestResult({ success: true, message: data.message || 'Gửi tin nhắn WhatsApp thành công!' });
        setWaAuthStatus('authorized');
        addToast('success', data.message || 'Gửi WhatsApp thành công!');
      } else {
        setWaTestResult({ success: false, message: data.message || 'Lỗi gửi tin nhắn WhatsApp.' });
        addToast('error', data.message || 'Gửi WhatsApp thất bại.');
      }
    } catch (e: any) {
      setWaTestResult({ success: false, message: e.message || 'Lỗi kết nối máy chủ.' });
      addToast('error', e.message || 'Lỗi kết nối.');
    } finally {
      setIsSendingWaTest(false);
    }
  };

  // Inspect / Scan Form from Provider Domain
  const handleInspectProviderForm = async (prov: ProviderTicketItem, chosenCat?: string) => {
    if (!currentPanel) return;
    setIsScanningForm(true);
    const targetCat = chosenCat || editCategory || prov.category || '18';
    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/inspect-ticket-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: prov.domain,
          username: prov.username,
          password: prov.password,
          category: targetCat,
        }),
      });
      const result = await res.json();
      if (result.data) {
        if (Array.isArray(result.data.categoriesTree) && result.data.categoriesTree.length > 0) {
          setScannedCategoriesTree(result.data.categoriesTree);
          const currentTreeCat = result.data.categoriesTree.find((c: any) => c.value === targetCat) || result.data.categoriesTree[0];
          if (currentTreeCat) {
            setScannedSubcategories(currentTreeCat.subcategories || []);
            setScannedDynamicFields(currentTreeCat.dynamicFields || []);
            if (!currentTreeCat.subcategories.some((s: any) => s.value === editSubcategory)) {
              setEditSubcategory(currentTreeCat.subcategories[0]?.value || '19');
            }
          }
        }
        if (Array.isArray(result.data.categories) && result.data.categories.length > 0) {
          setScannedCategories(result.data.categories);
        }
        if (Array.isArray(result.data.subcategories) && result.data.subcategories.length > 0) {
          setScannedSubcategories(result.data.subcategories);
          if (!result.data.subcategories.some((s: any) => s.value === editSubcategory)) {
            setEditSubcategory(result.data.subcategories[0]?.value || '19');
          }
        }
        if (Array.isArray(result.data.dynamicFields)) {
          setScannedDynamicFields(result.data.dynamicFields);
        }
        addToast('success', language === 'vi' ? 'Đã quét cấu trúc Form Ticket từ website NCC thành công!' : 'Form structure scanned successfully!');
      } else {
        addToast('info', result.message || 'Sử dụng cấu hình Perfect Panel chuẩn.');
      }
    } catch (e) {
      addToast('error', language === 'vi' ? 'Lỗi kết nối khi quét form NCC.' : 'Failed to scan provider form.');
    } finally {
      setIsScanningForm(false);
    }
  };

  const handleOpenEditProvider = (prov: ProviderTicketItem) => {
    setEditingProvider(prov);
    setTestResult(null);

    const savedCat = prov.category || '18';
    const savedSubcat = prov.subcategory || '19';
    setEditCategory(savedCat);
    setEditSubcategory(savedSubcat);
    setEditEnabled(prov.enabled !== false);

    // Nếu NCC ĐÃ CÓ lưu dữ liệu cấu hình trước đó -> Hiển thị ngay không cần quét lại
    if (prov.categoriesTree && prov.categoriesTree.length > 0) {
      setScannedCategoriesTree(prov.categoriesTree);
      setScannedCategories(prov.categories || prov.categoriesTree.map((c) => ({ value: c.value, text: c.text })));
      const matched = prov.categoriesTree.find((c) => c.value === savedCat) || prov.categoriesTree[0];
      if (matched) {
        setScannedSubcategories(matched.subcategories || []);
        setScannedDynamicFields(matched.dynamicFields || []);
      }
    } else if (savedCat && savedSubcat) {
      // Đã có lưu category và subcategory -> nạp danh mục tương thích để hiển thị trực tiếp
      const defaultTree = [
        {
          value: '18',
          text: 'Ai Support',
          subcategories: [
            { value: '19', text: 'Cancel' },
            { value: '21', text: 'Speed' },
            { value: '23', text: 'Refill' },
            { value: '25', text: 'Fake Comp' },
            { value: '27', text: 'Partial' },
          ],
          dynamicFields: [{ name: 'TicketForm[message]', label: 'Order ID' }],
        },
        {
          value: '1',
          text: 'Human Support',
          subcategories: [
            { value: '2', text: 'Cancel' },
            { value: '4', text: 'Speed' },
            { value: '6', text: 'Refill' },
            { value: '8', text: 'Mark as completed without done' },
          ],
          dynamicFields: [{ name: 'TicketForm[fields][33]', label: 'Order ID' }],
        },
        {
          value: '10',
          text: 'Payments',
          subcategories: [
            { value: '11', text: 'Payment Inquiry' },
            { value: '12', text: 'Bonus / Refund' },
          ],
          dynamicFields: [],
        },
      ];
      setScannedCategoriesTree(defaultTree);
      setScannedCategories(defaultTree.map((c) => ({ value: c.value, text: c.text })));
      const matched = defaultTree.find((c) => c.value === savedCat) || defaultTree[0];
      setScannedSubcategories(matched.subcategories);
      setScannedDynamicFields(matched.dynamicFields || []);
    } else {
      // Chưa từng cấu hình -> Xóa rỗng và tự động quét trực tiếp từ website NCC
      setScannedCategories([]);
      setScannedSubcategories([]);
      setScannedCategoriesTree([]);
      setScannedDynamicFields([]);
      handleInspectProviderForm(prov, undefined);
    }
  };

  const handleSendTestTicket = async () => {
    if (!currentPanel || !editingProvider) return;
    setIsSendingTestTicket(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/test-provider-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: editingProvider.domain,
          username: editingProvider.username,
          password: editingProvider.password,
          category: editCategory || editingProvider.category || '18',
          subcategory: editSubcategory || editingProvider.subcategory || '19',
          orderId: testOrderId.trim() || '123456',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message || `Đã gửi ticket mẫu tới ${editingProvider.domain} thành công!` });
        addToast('success', data.message || `Gửi ticket mẫu thành công!`);
      } else {
        setTestResult({ success: false, message: data.message || 'Gửi ticket mẫu thất bại.' });
        addToast('error', data.message || 'Gửi ticket mẫu thất bại.');
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Lỗi kết nối khi gửi ticket mẫu.' });
      addToast('error', 'Lỗi kết nối khi gửi ticket mẫu.');
    } finally {
      setIsSendingTestTicket(false);
    }
  };

  const handleSaveEditedProvider = async () => {
    if (!editingProvider) return;
    const updated = providers.map((p) => (
      p.id === editingProvider.id || p.domain === editingProvider.domain
        ? {
            ...p,
            category: editCategory || '18',
            subcategory: editSubcategory || '19',
            enabled: editEnabled,
            categoriesTree: scannedCategoriesTree,
            categories: scannedCategories,
            subcategories: scannedSubcategories,
            dynamicFields: scannedDynamicFields,
          }
        : p
    ));
    setProviders(updated);
    setEditingProvider(null);
    await handleSaveConfig(updated);
    addToast('success', language === 'vi' ? `Đã lưu cấu hình Ticket cho domain ${editingProvider.domain}!` : `Ticket config saved for ${editingProvider.domain}!`);
  };

  // Add new provider to the list (chỉ cần Domain, Username, Password)
  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !newUsername.trim() || !newPassword.trim()) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập đầy đủ domain NCC, tài khoản và mật khẩu.' : 'Please enter domain, username, and password.');
      return;
    }

    const cleanDomain = newDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const newProvItem: ProviderTicketItem = {
      id: cleanDomain,
      domain: cleanDomain,
      username: newUsername.trim(),
      password: newPassword.trim(),
      category: '18',
      subcategory: '19',
      enabled: true,
    };

    const updated = [...providers, newProvItem];
    setProviders(updated);
    setNewDomain('');
    setNewUsername('');
    setNewPassword('');
    setIsAddingNewProvider(false);
    await handleSaveConfig(updated);
    addToast('success', language === 'vi' ? `Đã thêm NCC ${cleanDomain}! Category mặc định [18-Ai Support] -> [19-Cancel], Enabled: true.` : `Added provider ${cleanDomain}! Default Category [18-Ai Support] -> [19-Cancel], Enabled: true.`);
  };

  // Delete provider
  const handleDeleteProvider = async (id: string) => {
    const updated = providers.filter((p) => p.id !== id);
    setProviders(updated);
    if (targetProviderId === id && updated.length > 0) {
      setTargetProviderId(updated[0].id);
    }
    await handleSaveConfig(updated);
  };

  // Toggle single provider status (true / false)
  const handleToggleProvider = async (id: string) => {
    const updated = providers.map((p) => (p.id === id || p.domain === id ? { ...p, enabled: p.enabled === false ? true : false } : p));
    setProviders(updated);
    await handleSaveConfig(updated);
    const target = updated.find((p) => p.id === id || p.domain === id);
    if (target) {
      addToast(
        'success',
        language === 'vi'
          ? `${target.enabled !== false ? 'Đã BẬT (enabled: true)' : 'Đã TẮT (enabled: false)'} gửi ticket cho domain ${target.domain}!`
          : `${target.enabled !== false ? 'Enabled (true)' : 'Disabled (false)'} ticket dispatch for ${target.domain}!`
      );
    }
  };

  // Send Direct Message / Ticket to Upstream Provider
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPanel || !messageContent.trim()) {
      addToast('error', language === 'vi' ? 'Vui lòng nhập nội dung tin nhắn cần gửi.' : 'Please enter message content.');
      return;
    }

    setSendingMessage(true);
    let channelLabel = '';
    let destinationLabel = '';

    const cleanInputDomain = targetProviderDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const matchedProvider = providers.find((p) => p.domain.toLowerCase() === cleanInputDomain.toLowerCase())
      || providers.find((p) => p.id === targetProviderId)
      || providers[0];

    const targetDomain = cleanInputDomain || matchedProvider?.domain || 'smmflare.com';
    const targetUsername = matchedProvider?.username || 'agency_partner';
    const targetPassword = matchedProvider?.password || 'password123';

    if (activeMethod === 'ticket') {
      if (!targetDomain) {
        addToast('error', language === 'vi' ? 'Vui lòng nhập domain nhà cung cấp nhận tin.' : 'Please enter target provider domain.');
        setSendingMessage(false);
        return;
      }
      channelLabel = `TICKET (${targetDomain})`;
      destinationLabel = `${targetDomain} (${targetUsername})`;
    } else if (activeMethod === 'telegram') {
      channelLabel = `TELEGRAM (Telethon User)`;
      destinationLabel = tgTarget || '@smmtop_com';
    } else if (activeMethod === 'whatsapp') {
      channelLabel = `WHATSAPP (${waTargetType === 'user' ? 'User' : 'Nhóm'})`;
      destinationLabel = waTargetType === 'user' ? waUserPhone : (waGroupLink || waGroupId);
    }

    try {
      const res = await fetch(`/api/panels/${currentPanel.id}/test-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetProviderId: matchedProvider?.id,
          targetProviderDomain: targetDomain,
          subject: messageSubject.trim() || 'Hỗ trợ dịch vụ & Đơn hàng',
          message: messageContent.trim(),
          dispatchConfig: {
            enabled: true,
            method: activeMethod,
            ticket: {
              providers,
              loginUrl: targetDomain,
              username: targetUsername,
              password: targetPassword,
            },
            telegram: {
              mode: tgMode,
              apiId: tgApiId ? Number(tgApiId) : 38320450,
              apiHash: tgApiHash || 'b6003998510ed054f3ba9dee4a258fce',
              sessionName: tgSessionName || 'telegram_user.session',
              target: tgTarget || '@smmtop_com',
              defaultMessage: tgDefaultMessage || 'Xin chào bạn mình đến từ naplike.com',
              targetType: tgTargetType,
              botToken: tgBotToken,
              userPhone: tgUserPhone,
              userUsername: tgUserUsername,
              chatId: tgChatId,
              groupUsername: tgGroupUsername,
              threadId: tgThreadId,
            },
            whatsapp: {
              targetType: waTargetType,
              userPhone: waUserPhone,
              groupLink: waGroupLink,
              groupId: waGroupId,
              defaultMessage: waDefaultMessage,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', language === 'vi' ? `Đã gửi tin nhắn thành công qua ${activeMethod.toUpperCase()}!` : `Message sent successfully via ${activeMethod.toUpperCase()}!`);
        setDispatchLogs((prev) => [
          {
            id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
            panelName: currentPanel.name,
            channel: channelLabel,
            destination: destinationLabel,
            subject: messageSubject.trim() || messageContent.trim().slice(0, 40),
            time: new Date().toLocaleTimeString(),
            status: 'success',
          },
          ...prev,
        ]);
        setMessageSubject('');
        setMessageContent('');
      } else {
        addToast('error', data.message || 'Gửi thất bại.');
      }
    } catch (e: any) {
      addToast('error', e.message || 'Lỗi gửi tin nhắn.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {language === 'vi' ? 'Cấu hình gửi tin nhắn tới nhà cung cấp' : 'Provider message & ticket dispatch'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                3 Phương thức
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'vi'
                ? 'Gửi tin nhắn qua Ticket NCC (nhiều domain Perfect Panel), Telegram (User/Nhóm), WhatsApp (User/Nhóm)'
                : 'Dispatch messages via Provider Ticket, Telegram (User/Group), or WhatsApp (User/Group)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSaveConfig()}
          disabled={saving}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
          <span>{saving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu cấu hình' : 'Save configuration')}</span>
        </button>
      </div>

      {/* 1. Chọn Panel Cấu Hình */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              {language === 'vi' ? 'Chọn panel cấu hình' : 'Select SMM panel'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {language === 'vi' ? 'Trạng thái chuyển tiếp:' : 'Forwarding status:'}
            </span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                enabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {enabled ? (language === 'vi' ? 'Đang bật' : 'Active') : (language === 'vi' ? 'Đang tắt' : 'Disabled')}
            </button>
          </div>
        </div>

        {/* Danh sách Panel để chọn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {panels.map((p) => {
            const isSelected = p.id === (currentPanel?.id || selectedPanelId);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPanelId(p.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 truncate">{p.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {p.planName || 'Standard'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="truncate max-w-[170px]">{p.customDomain || p.domain}</span>
                  <span className="font-bold text-blue-600 text-[10px]">#{p.id}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Cấu Hình 3 Kênh */}
      <div className="space-y-4">
        {/* Thanh chọn 3 Kênh */}
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 grid grid-cols-3 gap-1.5">
            {[
              { id: 'ticket', label: language === 'vi' ? '1. Ticket NCC' : '1. Provider ticket', icon: Ticket },
              { id: 'telegram', label: '2. Telegram', icon: Send },
              { id: 'whatsapp', label: '3. WhatsApp', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMethod === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMethod(tab.id as DispatchMethod)}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* KÊNH 1: TICKET NHÀ CUNG CẤP (MỖI LẦN THÊM LÀ DOMAIN KHÁC NHAU) */}
          {activeMethod === 'ticket' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'vi' ? 'Tài khoản & cổng gửi ticket NCC' : 'Provider ticket portal credentials'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {providers.length} {language === 'vi' ? 'domain NCC' : 'domains'}
                  </span>
                </div>

                {!isAddingNewProvider && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewProvider(true)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-blue-200"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Thêm domain NCC' : 'Add domain'}</span>
                  </button>
                )}
              </div>

              {/* Form Thêm Domain NCC Mới */}
              {isAddingNewProvider && (
                <form onSubmit={handleAddProvider} className="p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                      {language === 'vi' ? 'Thêm cấu hình domain NCC Perfect Panel mới' : 'Add new provider domain'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewProvider(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Domain nhà cung cấp (Perfect Panel)' : 'Provider domain'}
                    </label>
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="VD: smmflare.com, fastsmm.vip, smmkingdom.com..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'vi' ? 'Tài khoản (Username / Email)' : 'Username / Email'}
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="VD: agency_partner"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {language === 'vi' ? 'Mật khẩu' : 'Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono pr-9 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {language === 'vi' ? 'Lưu domain nhà cung cấp' : 'Save provider domain'}
                  </button>
                </form>
              )}

              {/* Danh Sách Các Domain NCC Đã Cấu Hình */}
              <div className="space-y-3">
                {providers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-xs text-slate-700">
                      {language === 'vi' ? 'Chưa có domain NCC nào được cấu hình' : 'No provider domain configured yet'}
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      {language === 'vi'
                        ? 'Bấm nút "+ Thêm domain NCC" ở trên để kết nối tài khoản Perfect Panel của nhà cung cấp.'
                        : 'Click "+ Add domain" above to configure your upstream Perfect Panel provider.'}
                    </p>
                  </div>
                ) : (
                  providers.map((prov) => {
                  const isPassVisible = visiblePasswordIds[prov.id];
                  const isSelectedForDirectMsg = targetProviderId === prov.id;

                  return (
                    <div
                      key={prov.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelectedForDirectMsg
                          ? 'border-blue-500 bg-blue-50/20 shadow-2xs ring-1 ring-blue-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-xs text-slate-900 font-mono">
                            {prov.domain}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            Perfect Panel
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Switch Bật/Tắt (Enabled) */}
                          <button
                            type="button"
                            onClick={() => handleToggleProvider(prov.id)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              prov.enabled !== false ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={prov.enabled !== false ? 'Enabled: True' : 'Enabled: False'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                prov.enabled !== false ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProvider(prov.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title={language === 'vi' ? 'Xóa cấu hình' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prov.username}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{isPassVisible ? prov.password : '••••••••••••'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisiblePasswordIds((prev) => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          >
                            {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap border-t border-slate-100 pt-2">
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          {prov.category ? (
                            <>
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                                Cat: {prov.category === '18' ? '18 (Ai Support)' : prov.category === '1' ? '1 (Human Support)' : prov.category === '10' ? '10 (Payments)' : `[${prov.category}]`}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                                Subcat: {prov.subcategory === '19' ? '19 (Cancel)' : prov.subcategory === '23' ? '23 (Refill)' : prov.subcategory === '21' ? '21 (Speed)' : prov.subcategory === '2' ? '2 (Cancel)' : prov.subcategory === '6' ? '6 (Refill)' : (prov.subcategory ? `[${prov.subcategory}]` : 'Chưa chọn')}
                              </span>
                            </>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>{language === 'vi' ? 'Chưa cấu hình Form Ticket' : 'Not configured yet'}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProvider(prov)}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 shadow-2xs"
                          >
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            <span>{language === 'vi' ? 'Xem & Edit Form Ticket' : 'Edit Ticket Form'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>

              {/* MODAL / DRAWER: XEM & EDIT CẤU HÌNH FORM TICKET TỪ WEBSITE NCC */}
              {editingProvider && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-in fade-in duration-200">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-5 max-h-[92vh] overflow-y-auto">
                    {/* Header Modal */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                          <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                              {language === 'vi' ? 'Cấu hình Form Ticket NCC' : 'Provider Ticket Setup'}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {editingProvider.domain}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{editingProvider.username}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingProvider(null)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Card Trạng Thái Toggle Enabled */}
                    <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      editEnabled
                        ? 'bg-emerald-50/70 border-emerald-200/80 shadow-xs'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-colors ${
                          editEnabled ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {language === 'vi' ? 'Tự động gửi Ticket cho Domain này' : 'Auto Dispatch to this Domain'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {editEnabled
                              ? (language === 'vi' ? 'Hệ thống sẽ tự động chuyển tiếp đơn hàng sang NCC này' : 'Orders will be automatically forwarded')
                              : (language === 'vi' ? 'Đang tạm dừng gửi đơn tự động tới NCC này' : 'Ticket forwarding is currently paused')}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditEnabled(!editEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          editEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={editEnabled ? 'Enabled: True' : 'Enabled: False'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            editEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Thanh Quét Form Website */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs text-blue-950">
                          <div className="font-bold">{language === 'vi' ? 'Cào cấu trúc Form Website NCC' : 'Live Website Form Sync'}</div>
                          <div className="text-[11px] text-blue-700/80">
                            {language === 'vi' ? 'Tự động tải toàn bộ danh mục Category & Subcategory' : 'Fetches real-time ticket categories'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInspectProviderForm(editingProvider, editCategory)}
                        disabled={isScanningForm}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {isScanningForm ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'vi' ? 'Đang quét...' : 'Scanning...'}</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{language === 'vi' ? 'Quét lại Form' : 'Re-scan'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Phần Lựa Chọn Category & Subcategory với Select2 */}
                    {isScanningForm ? (
                      <div className="p-8 text-center bg-blue-50/40 rounded-2xl border border-blue-100 space-y-2.5">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
                        <div className="text-xs font-bold text-slate-800">
                          {language === 'vi' ? 'Đang tự động đăng nhập và quét form từ website...' : 'Logging in and scanning ticket form...'}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {language === 'vi' ? 'Hệ thống đang giải Captcha và tải danh mục thực tế của NCC.' : 'Solving captcha and extracting real categories from provider.'}
                        </p>
                      </div>
                    ) : scannedCategories.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                        <Ticket className="w-7 h-7 text-slate-400 mx-auto" />
                        <div className="text-xs font-bold text-slate-700">
                          {language === 'vi' ? 'Chưa quét danh mục từ Website NCC' : 'No categories scanned yet'}
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          {language === 'vi' ? 'Bấm nút "Quét lại Form" ở trên để hệ thống tự động tải danh mục tương thích.' : 'Click "Re-scan" above to load real categories from upstream.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Danh Sách Chọn Category với Select2 */}
                        <div className="space-y-1.5">
                          <label className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                              <span>{language === 'vi' ? 'Category (Chủ đề chính)' : 'Category'}</span>
                            </span>
                            <span className="text-[10px] text-purple-600 font-mono bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              Value: {editCategory || 'Chưa chọn'}
                            </span>
                          </label>
                          <Select2
                            value={editCategory}
                            options={scannedCategories.map((c) => ({
                              value: c.value,
                              label: `[${c.value}] ${c.text}`,
                              badge: `ID ${c.value}`,
                            }))}
                            placeholder={language === 'vi' ? '-- Tìm & Chọn Category --' : '-- Search & Select Category --'}
                            onChange={(newCat) => {
                              setEditCategory(newCat);
                              const matched = scannedCategoriesTree.find((c) => c.value === newCat);
                              if (matched && matched.subcategories && matched.subcategories.length > 0) {
                                setScannedSubcategories(matched.subcategories);
                                setScannedDynamicFields(matched.dynamicFields || []);
                                setEditSubcategory(matched.subcategories[0]?.value || '19');
                              } else {
                                handleInspectProviderForm(editingProvider, newCat);
                              }
                            }}
                          />
                        </div>

                        {/* Danh Sách Chọn Subcategory với Select2 */}
                        <div className="space-y-1.5">
                          <label className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              <span>{language === 'vi' ? 'Subcategory (Chủ đề con)' : 'Subcategory'}</span>
                            </span>
                            <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              Value: {editSubcategory || 'Chưa chọn'}
                            </span>
                          </label>
                          <Select2
                            value={editSubcategory}
                            options={scannedSubcategories.map((s) => ({
                              value: s.value,
                              label: `[${s.value}] ${s.text}`,
                              badge: `ID ${s.value}`,
                            }))}
                            placeholder={language === 'vi' ? '-- Tìm & Chọn Subcategory --' : '-- Search & Select Subcategory --'}
                            onChange={(newSubcat) => setEditSubcategory(newSubcat)}
                          />
                        </div>

                        {/* Hiển thị các trường con động phát hiện được */}
                        {scannedDynamicFields.length > 0 && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                            <div className="font-bold text-slate-700 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-slate-500" />
                              <span>{language === 'vi' ? 'Các trường con phát hiện trong Form:' : 'Detected Child Fields:'}</span>
                            </div>
                            <div className="space-y-0.5 text-slate-600 font-mono text-[11px] pl-5">
                              {scannedDynamicFields.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>{f.name} {f.label ? `(${f.label})` : ''}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BOX GỬI THỬ TICKET MẪU VỚI ORDER ID */}
                    <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl border border-emerald-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'vi' ? 'Gửi thử Ticket Mẫu tới NCC' : 'Send Test Ticket'}</span>
                        </div>
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          TEST DISPATCH
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={testOrderId}
                            onChange={(e) => setTestOrderId(e.target.value)}
                            placeholder="Nhập Order ID mẫu (VD: 123456)"
                            className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendTestTicket}
                          disabled={isSendingTestTicket || isScanningForm || !editCategory}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                          {isSendingTestTicket ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{language === 'vi' ? 'Đang gửi...' : 'Sending...'}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? `Gửi mẫu ${testOrderId || '123456'}` : 'Send Test'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {testResult && (
                        <div className={`p-3 rounded-xl text-xs font-mono border flex items-start gap-2 ${testResult.success ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900' : 'bg-rose-100/70 border-rose-300 text-rose-900'}`}>
                          {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" /> : <X className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
                          <span>{testResult.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Hành Động */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingProvider(null)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEditedProvider}
                        disabled={scannedCategories.length === 0}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'vi' ? 'Lưu cấu hình Ticket' : 'Save Ticket Config'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KÊNH 2: TELEGRAM (GỬI QUA TÀI KHOẢN TELETHON USER) */}
          {activeMethod === 'telegram' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'vi' ? 'Cấu hình gửi Telegram (Tài khoản Telethon)' : 'Telegram Dispatch Configuration (Telethon)'}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  TELETHON USER
                </span>
              </div>

              <div className="space-y-4 animate-in fade-in duration-150">
                {/* KHUNG XÁC THỰC ĐĂNG NHẬP TELEGRAM (TELETHON AUTH FLOW) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-slate-800 text-xs">
                        {language === 'vi' ? 'Trạng thái phiên đăng nhập Telethon' : 'Telethon Session Status'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tgAuthStatus === 'checking' && (
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>Đang kiểm tra...</span>
                        </span>
                      )}
                      {tgAuthStatus === 'authorized' && (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>ĐÃ ĐĂNG NHẬP</span>
                        </span>
                      )}
                      {tgAuthStatus === 'unauthorized' && (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>CHƯA XÁC THỰC</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleCheckTelegramAuth}
                        title="Kiểm tra lại trạng thái phiên"
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP THÀNH CÔNG */}
                  {tgAuthStatus === 'authorized' && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {(tgAuthUser?.first_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                            <span>{tgAuthUser?.first_name} {tgAuthUser?.last_name || ''}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200/70 text-emerald-800 rounded-sm font-semibold">Đã lưu session</span>
                          </div>
                          <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                            {tgAuthUser?.username ? `@${tgAuthUser.username}` : (tgAuthUser?.phone ? `+${tgAuthUser.phone}` : 'Telegram User')} • File: <code className="font-bold">telegram_user.session</code>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleTelegramDeleteSession}
                          title="Xóa file telegram_user.session trên máy chủ và hủy phiên đăng nhập"
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa session & Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP -> FLOW NHẬP PHONE VÀ NHẬP CODE */}
                  {tgAuthStatus !== 'authorized' && (
                    <div className="space-y-3 pt-0.5 text-xs">
                      {/* BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI (Please enter your phone) */}
                      {!tgCodeSent && (
                        <div className="space-y-2">
                          <label className="block font-semibold text-slate-700">
                            {language === 'vi' ? 'Please enter your phone (or bot token):' : 'Please enter your phone (or bot token):'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tgAuthPhone}
                              onChange={(e) => setTgAuthPhone(e.target.value)}
                              placeholder="+84988776655 (Định dạng quốc tế kèm mã vùng)"
                              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={handleTelegramSendCode}
                              disabled={isSendingCode || !tgAuthPhone.trim()}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5 shrink-0"
                            >
                              {isSendingCode ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang gửi mã...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Gửi mã xác thực</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Hệ thống sẽ gửi mã xác thực đăng nhập qua ứng dụng Telegram hoặc tin nhắn SMS của bạn.</span>
                            <button
                              type="button"
                              onClick={handleTelegramDeleteSession}
                              className="text-red-500 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer shrink-0"
                              title="Xóa file session telegram_user.session cũ trên máy chủ nếu có"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa session cũ</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* BƯỚC 2: NHẬP MÃ XÁC THỰC (Please enter the code you received) */}
                      {tgCodeSent && !tgNeeds2Fa && (
                        <div className="space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <label className="block font-bold text-blue-900">
                              {language === 'vi' ? 'Please enter the code you received:' : 'Please enter the code you received:'}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setTgCodeSent(false);
                                setTgAuthCode('');
                                setTgAuthMessage(null);
                              }}
                              className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                            >
                              Đổi số điện thoại
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tgAuthCode}
                              onChange={(e) => setTgAuthCode(e.target.value)}
                              placeholder="12345 (Nhập 5 số mã xác thực)"
                              className="flex-1 px-3.5 py-2 rounded-xl border border-blue-300 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-center tracking-widest"
                            />
                            <button
                              type="button"
                              onClick={handleTelegramSignIn}
                              disabled={isVerifyingCode || !tgAuthCode.trim()}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5 shrink-0"
                            >
                              {isVerifyingCode ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang xác thực...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Xác thực & Đăng nhập</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Đã gửi mã tới số: <strong className="text-slate-800">{tgAuthPhone}</strong>. Sau khi đăng nhập, phiên sẽ được lưu vĩnh viễn vào file <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">telegram_user.session</code>.
                          </div>
                        </div>
                      )}

                      {/* BƯỚC 3: NẾU BẬT 2FA (Cloud Password) */}
                      {tgNeeds2Fa && (
                        <div className="space-y-2 animate-in fade-in duration-150">
                          <label className="block font-bold text-amber-900">
                            {language === 'vi' ? 'Vui lòng nhập mật khẩu bảo mật 2 lớp (2FA Cloud Password):' : 'Please enter your 2FA Cloud Password:'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              value={tgAuthPassword}
                              onChange={(e) => setTgAuthPassword(e.target.value)}
                              placeholder="Nhập mật khẩu 2FA Telegram..."
                              className="flex-1 px-3.5 py-2 rounded-xl border border-amber-300 bg-white font-mono text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={handleTelegramSignIn}
                              disabled={isVerifyingCode || !tgAuthPassword.trim()}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5 shrink-0"
                            >
                              {isVerifyingCode ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Đang kiểm tra...</span>
                                </>
                              ) : (
                                <>
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Xác nhận 2FA</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Auth Message Banner */}
                      {tgAuthMessage && (
                        <div
                          className={`p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                            tgAuthMessage.type === 'success'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : tgAuthMessage.type === 'error'
                              ? 'bg-red-50 border-red-200 text-red-900'
                              : 'bg-blue-50 border-blue-200 text-blue-900'
                          }`}
                        >
                          {tgAuthMessage.type === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          ) : tgAuthMessage.type === 'error' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 font-mono text-[11px] break-all">{tgAuthMessage.text}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* THÔNG SỐ CẤU HÌNH KẾT NỐI TELETHON */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-4 text-xs">
                  <div className="flex items-center gap-2 pb-1 border-b border-blue-100 text-blue-900 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'vi' ? 'Thông số kết nối Telethon (Send-Telegram)' : 'Telethon Connection Parameters'}</span>
                  </div>

                  {/* HƯỚNG DẪN LẤY API ID & API HASH TỪ TELEGRAM */}
                  <div className="p-3.5 rounded-xl bg-white border border-blue-200/90 shadow-2xs space-y-2 text-slate-800">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'vi' ? 'Hướng dẫn lấy API ID & API HASH từ my.telegram.org:' : 'How to get Telegram API ID & API HASH:'}</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                      <li>
                        {language === 'vi' ? 'Truy cập cổng nhà phát triển chính thức của Telegram: ' : 'Visit official Telegram portal: '}
                        <a
                          href="https://my.telegram.org/apps"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-bold underline hover:text-blue-800 inline-flex items-center gap-0.5"
                        >
                          <span>https://my.telegram.org/apps</span>
                          <ArrowRight className="w-3 h-3 inline" />
                        </a>
                      </li>
                      <li>{language === 'vi' ? 'Đăng nhập bằng số điện thoại tài khoản Telegram của bạn và nhập mã OTP gửi về app.' : 'Log in with your Telegram phone number and enter the confirmation code.'}</li>
                      <li>{language === 'vi' ? 'Chọn mục "API development tools".' : 'Select "API development tools".'}</li>
                      <li>{language === 'vi' ? 'Nhập App title và Short name (ví dụ: SupportTool), sau đó nhấn "Create application".' : 'Enter App title and Short name, then click "Create application".'}</li>
                      <li>
                        {language === 'vi' ? 'Sao chép ' : 'Copy '}
                        <strong className="text-blue-900 font-mono">App api_id</strong>
                        {language === 'vi' ? ' và ' : ' and '}
                        <strong className="text-blue-900 font-mono">App api_hash</strong>
                        {language === 'vi' ? ' dán vào 2 ô bên dưới (nếu để trống, hệ thống sẽ sử dụng thông số mặc định sẵn có).' : ' and paste into the inputs below (leave blank to use defaults).'}
                      </li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {language === 'vi' ? 'Telethon API ID' : 'API ID'}
                      </label>
                      <input
                        type="text"
                        value={tgApiId}
                        onChange={(e) => setTgApiId(e.target.value)}
                        placeholder="38320450"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {language === 'vi' ? 'Telethon API HASH' : 'API HASH'}
                      </label>
                      <input
                        type="text"
                        value={tgApiHash}
                        onChange={(e) => setTgApiHash(e.target.value)}
                        placeholder="b6003998510ed054f3ba9dee4a258fce"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Đích gửi mặc định (Target @username / SĐT người nhận)' : 'Default Target (@username / phone)'}
                    </label>
                    <input
                      type="text"
                      value={tgTarget}
                      onChange={(e) => {
                        setTgTarget(e.target.value);
                        setTgTestTarget(e.target.value);
                      }}
                      placeholder="@smmtop_com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>


                {/* NÚT LƯU CẤU HÌNH TELEGRAM */}
                <div className="flex items-center justify-end pt-2 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={() => handleSaveConfig()}
                    disabled={saving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                    <span>{saving ? (language === 'vi' ? 'Đang lưu cấu hình...' : 'Saving...') : (language === 'vi' ? 'Lưu cấu hình Telegram' : 'Save Telegram Configuration')}</span>
                  </button>
                </div>
              </div>

              {/* KHUNG TEST GỬI TIN NHẮN MẪU TRỰC TIẾP TỚI TELEGRAM */}
              <div className="p-4.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    <span>{language === 'vi' ? 'Thử nghiệm gửi tin nhắn mẫu tới Telegram' : 'Test Send Sample Telegram Message'}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">
                    Mode: Telethon User Python (Send-Telegram)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Đích nhận tin nhắn (Target)' : 'Recipient / Target'}
                    </label>
                    <input
                      type="text"
                      value={tgTestTarget}
                      onChange={(e) => setTgTestTarget(e.target.value)}
                      placeholder="@smmtop_com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Nội dung tin nhắn test' : 'Sample message content'}
                    </label>
                    <input
                      type="text"
                      value={tgTestMessage}
                      onChange={(e) => setTgTestMessage(e.target.value)}
                      placeholder="Xin chào bạn mình đến từ naplike.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500">
                    {language === 'vi'
                      ? 'Nhấn nút để thực thi gửi tin nhắn trực tiếp qua backend server'
                      : 'Click button to execute test message via backend server'}
                  </div>
                  <button
                    type="button"
                    onClick={handleTestTelegramSend}
                    disabled={isSendingTgTest || !tgTestTarget.trim()}
                    className="px-4.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                  >
                    {isSendingTgTest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'vi' ? 'Đang gửi test...' : 'Sending test...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Gửi tin nhắn mẫu tới Telegram' : 'Send Sample Telegram Message'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Alert Box */}
                {tgTestResult && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
                      tgTestResult.success
                        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                        : 'border-amber-200 bg-amber-50/80 text-amber-900'
                    }`}
                  >
                    {tgTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 font-mono text-[11px] leading-relaxed break-all">
                      {tgTestResult.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KÊNH 3: WHATSAPP (CẤU HÌNH SEND-WHATSAPP / WHATSAPP-WEB.JS) */}
          {activeMethod === 'whatsapp' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4.5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'vi' ? 'Cấu hình gửi tin nhắn WhatsApp (Send-Whatsapp)' : 'WhatsApp Dispatch Configuration'}
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Node.js + whatsapp-web.js (.wwebjs_auth)
                </span>
              </div>

              {/* KHUNG TRẠNG THÁI PHIÊN ĐĂNG NHẬP WHATSAPP (.wwebjs_auth) */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-950">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'vi' ? 'Trạng thái phiên đăng nhập WhatsApp (.wwebjs_auth)' : 'WhatsApp Session Status'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCheckWhatsappAuth(false)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${waAuthStatus === 'checking' ? 'animate-spin' : ''}`} />
                      <span>{language === 'vi' ? 'Kiểm tra phiên' : 'Check status'}</span>
                    </button>

                    {waAuthStatus === 'authorized' && (
                      <button
                        type="button"
                        onClick={handleDeleteWhatsappSession}
                        className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title={language === 'vi' ? 'Xóa thư mục session .wwebjs_auth' : 'Delete session directory'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Đăng xuất / Xóa phiên' : 'Logout'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {waAuthStatus === 'authorized' ? (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-xs text-emerald-900">
                            {language === 'vi' ? 'Đã có phiên đăng nhập WhatsApp (.wwebjs_auth) sẵn sàng' : 'WhatsApp session is active and ready'}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {language === 'vi'
                              ? 'Dữ liệu xác thực được lưu tại thư mục Send-Whatsapp/.wwebjs_auth. Hệ thống sẽ tự động sử dụng phiên này để gửi tin nhắn.'
                              : 'Auth data is saved in Send-Whatsapp/.wwebjs_auth. System will dispatch messages using this session.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartWhatsappLogin}
                        className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        title={language === 'vi' ? 'Quét lại mã QR để đổi tài khoản WhatsApp' : 'Scan QR to re-authenticate'}
                      >
                        <QrCode className="w-3 h-3" />
                        <span>{language === 'vi' ? 'Quét lại mã QR' : 'Re-scan QR'}</span>
                      </button>
                    </div>
                  </div>
                ) : waAuthStatus === 'checking' ? (
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2 text-slate-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>{language === 'vi' ? 'Đang kiểm tra phiên đăng nhập...' : 'Checking session...'}</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-amber-900">
                          {language === 'vi' ? 'Chưa phát hiện phiên đăng nhập WhatsApp (.wwebjs_auth)' : 'No WhatsApp session detected'}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {language === 'vi'
                            ? 'Bấm nút "Đăng nhập WhatsApp" bên dưới để tạo mã QR và dùng ứng dụng WhatsApp trên điện thoại quét mã liên kết tài khoản.'
                            : 'Click "Login WhatsApp" below to generate QR code and scan with your WhatsApp phone app.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{language === 'vi' ? 'WhatsApp trên ĐT > Cài đặt > Thiết bị liên kết > Quét mã' : 'WhatsApp app > Settings > Linked Devices > Scan QR'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartWhatsappLogin}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Đăng nhập WhatsApp (Quét mã QR)' : 'Login WhatsApp (Scan QR)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CẤU HÌNH ĐÍCH NHẬN TIN NHẮN WHATSAPP */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-white space-y-4 text-xs">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs pb-1 border-b border-slate-100">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'vi' ? 'Cấu hình Đích nhận tin nhắn (Target)' : 'Recipient / Target Configuration'}</span>
                </div>

                {/* Loại đích: Cá nhân / Link mời nhóm / ID nhóm */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setWaTargetType('user');
                      setWaTestTarget(waUserPhone || '');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      waTargetType === 'user'
                        ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs">Cá nhân (SĐT)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">Gửi qua --to (Số ĐT cá nhân)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWaTargetType('invite');
                      setWaTestTarget(waGroupLink || '');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      waTargetType === 'invite'
                        ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs">Link mời nhóm</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">Gửi qua --invite (Invite URL)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWaTargetType('group');
                      setWaTestTarget(waGroupId || '');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      waTargetType === 'group'
                        ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs">Nhóm / Group JID</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">Gửi qua --group (Tên/JID)</p>
                  </button>
                </div>

                {waTargetType === 'user' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Số điện thoại người nhận (+84... / 84...)' : 'Recipient Phone Number'}
                    </label>
                    <input
                      type="text"
                      value={waUserPhone}
                      onChange={(e) => {
                        setWaUserPhone(e.target.value);
                        if (waTargetType === 'user') setWaTestTarget(e.target.value);
                      }}
                      placeholder="84901234567 hoặc +84988776655"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                {waTargetType === 'invite' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Link mời nhóm WhatsApp (Group Invite Link)' : 'Group Invite Link'}
                    </label>
                    <input
                      type="url"
                      value={waGroupLink}
                      onChange={(e) => {
                        setWaGroupLink(e.target.value);
                        if (waTargetType === 'invite') setWaTestTarget(e.target.value);
                      }}
                      placeholder="https://chat.whatsapp.com/LOAZTNFUMjGHXsoxPsGdwA..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                {waTargetType === 'group' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Group JID hoặc Tên nhóm chính xác (Group JID / Name)' : 'Group JID or Exact Name'}
                    </label>
                    <input
                      type="text"
                      value={waGroupId}
                      onChange={(e) => {
                        setWaGroupId(e.target.value);
                        if (waTargetType === 'group') setWaTestTarget(e.target.value);
                      }}
                      placeholder="120363028192837@g.us hoặc Tên nhóm hỗ trợ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                {/* NÚT LƯU CẤU HÌNH WHATSAPP */}
                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveConfig()}
                    disabled={saving}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                    <span>{saving ? (language === 'vi' ? 'Đang lưu cấu hình...' : 'Saving...') : (language === 'vi' ? 'Lưu cấu hình WhatsApp' : 'Save WhatsApp Configuration')}</span>
                  </button>
                </div>
              </div>

              {/* KHUNG TEST GỬI TIN NHẮN MẪU TRỰC TIẾP TỚI WHATSAPP */}
              <div className="p-4.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3.5 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    <span>{language === 'vi' ? 'Thử nghiệm gửi tin nhắn mẫu tới WhatsApp' : 'Test Send Sample WhatsApp Message'}</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">
                    Mode: Send-Whatsapp (whatsapp_client.js)
                  </span>
                </div>

                {/* Bộ chọn loại đích thử nghiệm nhanh */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setWaTargetType('user');
                      setWaTestTarget(waUserPhone || '');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      waTargetType === 'user'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Cá nhân (SĐT)' : 'Personal Phone'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWaTargetType('invite');
                      setWaTestTarget(waGroupLink || '');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      waTargetType === 'invite'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Link mời nhóm' : 'Group Invite Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWaTargetType('group');
                      setWaTestTarget(waGroupId || '');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      waTargetType === 'group'
                        ? 'bg-white text-emerald-700 shadow-2xs font-bold border border-emerald-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>{language === 'vi' ? 'Nhóm (JID/Tên)' : 'Group (JID/Name)'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {waTargetType === 'invite'
                        ? (language === 'vi' ? 'Link mời nhóm thử nghiệm (Invite Link)' : 'Test Group Invite Link')
                        : waTargetType === 'group'
                        ? (language === 'vi' ? 'Group JID / Tên nhóm thử nghiệm' : 'Test Group JID / Exact Name')
                        : (language === 'vi' ? 'Số điện thoại nhận thử nghiệm (SĐT)' : 'Test Phone Number')}
                    </label>
                    <input
                      type={waTargetType === 'invite' ? 'url' : 'text'}
                      value={waTestTarget}
                      onChange={(e) => setWaTestTarget(e.target.value)}
                      placeholder={
                        waTargetType === 'invite'
                          ? 'https://chat.whatsapp.com/LOAZTNFUMjGHXsoxPsGdwA...'
                          : waTargetType === 'group'
                          ? '120363028192837@g.us hoặc Tên nhóm'
                          : '84901234567 hoặc +84988776655'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'vi' ? 'Nội dung tin nhắn test' : 'Sample message content'}
                    </label>
                    <input
                      type="text"
                      value={waTestMessage}
                      onChange={(e) => setWaTestMessage(e.target.value)}
                      placeholder="Xin chào bạn mình đến từ naplike.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-200/60">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {waTargetType === 'invite'
                        ? (language === 'vi' ? 'Script sẽ tự động tham gia nhóm qua link mời và gửi tin nhắn thử nghiệm qua --invite' : 'Will join group via invite link and dispatch test message via --invite')
                        : waTargetType === 'group'
                        ? (language === 'vi' ? 'Script sẽ gửi tin nhắn thử nghiệm trực tiếp đến Group JID / Tên nhóm qua --group' : 'Will send test message to group JID / name via --group')
                        : (language === 'vi' ? 'Script sẽ gửi tin nhắn thử nghiệm trực tiếp đến số điện thoại cá nhân qua --to' : 'Will send test message to phone number via --to')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestWhatsappSend}
                    disabled={isSendingWaTest || !waTestTarget.trim()}
                    className="px-4.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isSendingWaTest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'vi' ? 'Đang gửi test...' : 'Sending test...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {waTargetType === 'invite'
                            ? (language === 'vi' ? 'Gửi thử nghiệm qua Link nhóm' : 'Test via Group Link')
                            : waTargetType === 'group'
                            ? (language === 'vi' ? 'Gửi thử nghiệm tới Nhóm' : 'Test via Group JID/Name')
                            : (language === 'vi' ? 'Gửi thử nghiệm tới SĐT' : 'Test via Phone')}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Alert Box */}
                {waTestResult && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
                      waTestResult.success
                        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                        : 'border-amber-200 bg-amber-50/80 text-amber-900'
                    }`}
                  >
                    {waTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 font-mono text-[11px] leading-relaxed break-all">
                      {waTestResult.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tùy chọn Tự Động Bắn Đơn Cho Panel */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoTicketMain"
                checked={autoCreateOnOrder}
                onChange={(e) => setAutoCreateOnOrder(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="autoTicketMain" className="font-bold text-xs text-slate-900 cursor-pointer select-none">
                {language === 'vi'
                  ? 'Tự động gửi tin nhắn / ticket tới NCC ngay khi khách tạo đơn hàng mới trên Panel'
                  : 'Auto-dispatch message/ticket to provider immediately after order creation'}
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 pl-6">
              {language === 'vi'
                ? 'Hệ thống tự động đồng bộ mã đơn, số lượng, link mục tiêu tới kênh đã cấu hình.'
                : 'Automatically synchronizes order ID, quantity, and target link.'}
            </p>
          </div>
      </div>

      {/* MODAL QUÉT MÃ QR ĐĂNG NHẬP WHATSAPP */}
      {showWaLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'vi' ? 'Đăng nhập WhatsApp (.wwebjs_auth)' : 'WhatsApp Web QR Login'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'vi' ? 'Quét mã QR để liên kết tài khoản WhatsApp' : 'Scan QR code to link WhatsApp account'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelWhatsappLogin}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Step Guide */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1.5 text-xs text-slate-700">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'vi' ? 'Hướng dẫn quét mã trên điện thoại:' : 'Instructions:'}</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                  <li>{language === 'vi' ? 'Mở ứng dụng WhatsApp trên điện thoại.' : 'Open WhatsApp on your phone.'}</li>
                  <li>{language === 'vi' ? 'Vào Cài đặt (Settings) > Thiết bị liên kết (Linked Devices).' : 'Go to Settings > Linked Devices.'}</li>
                  <li>{language === 'vi' ? 'Chọn Liên kết thiết bị (Link a device).' : 'Tap Link a Device.'}</li>
                  <li>{language === 'vi' ? 'Hướng camera quét mã QR bên dưới.' : 'Point your camera at the QR code below.'}</li>
                </ol>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[280px]">
                {waLoginState === 'starting' && (
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <div className="text-xs font-semibold text-slate-700">
                      {language === 'vi' ? 'Đang khởi tạo Chrome & tạo mã QR...' : 'Starting Chrome & generating QR code...'}
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      {language === 'vi' ? 'Quá trình khởi chạy có thể mất vài giây' : 'This might take a few seconds'}
                    </p>
                  </div>
                )}

                {waLoginState === 'qr' && waQrDataUrl && (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md">
                      <img
                        src={waQrDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-56 h-56 object-contain rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                      <span>{language === 'vi' ? 'Đang chờ quét mã QR...' : 'Waiting for scan...'}</span>
                    </div>
                  </div>
                )}

                {waLoginState === 'authenticated' && (
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-emerald-800">
                      {language === 'vi' ? 'Đã xác thực tài khoản WhatsApp!' : 'WhatsApp Authenticated!'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {language === 'vi' ? 'Đang tải dữ liệu và lưu phiên (.wwebjs_auth)...' : 'Saving session files (.wwebjs_auth)...'}
                    </p>
                  </div>
                )}

                {waLoginState === 'ready' && (
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="text-xs font-bold text-emerald-800">
                      {language === 'vi' ? 'Đăng nhập WhatsApp thành công!' : 'WhatsApp Login Successful!'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {language === 'vi' ? 'Phiên đăng nhập đã sẵn sàng. Cửa sổ sẽ tự đóng trong giây lát.' : 'Session is active. Closing modal shortly.'}
                    </p>
                  </div>
                )}

                {waLoginState === 'error' && (
                  <div className="flex flex-col items-center justify-center text-center space-y-3 py-8">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-red-800">
                      {language === 'vi' ? 'Không thể tạo phiên hoặc mã QR hết hạn' : 'Failed to generate QR or expired'}
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-xs text-center">
                      {waLoginError || (language === 'vi' ? 'Vui lòng thử lại.' : 'Please try again.')}
                    </p>
                    <button
                      type="button"
                      onClick={handleStartWhatsappLogin}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                    >
                      {language === 'vi' ? 'Thử lại' : 'Retry'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleStartWhatsappLogin}
                disabled={waLoginState === 'starting' || waLoginState === 'authenticated' || waLoginState === 'ready'}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${waLoginState === 'starting' ? 'animate-spin' : ''}`} />
                <span>{language === 'vi' ? 'Làm mới mã QR' : 'Refresh QR'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelWhatsappLogin}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                {language === 'vi' ? 'Đóng / Hủy' : 'Close / Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
