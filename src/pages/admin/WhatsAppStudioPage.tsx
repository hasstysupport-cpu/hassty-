import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  MapPin,
  Smile,
  ListFilter,
  MousePointerClick,
  PhoneCall,
  Link,
  ShieldCheck,
  Zap,
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';
import { whatsappService, InteractiveButton, InteractiveListSection, WhatsAppGatewayStatus } from '../../lib/whatsappService';

export const WhatsAppStudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'interactive' | 'list' | 'media' | 'location' | 'reaction'>('interactive');
  const [status, setStatus] = useState<WhatsAppGatewayStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Form State
  const [phone, setPhone] = useState('201080158828');
  const [textMessage, setTextMessage] = useState('مرحباً بك في منصة حِصّتي! 👋🔥\nتم تفعيل حسابك بنجاح.');
  
  // Interactive Buttons State
  const [footerText, setFooterText] = useState('منصة حصتي للدروس الخصوصية');
  const [otpCodeToCopy, setOtpCodeToCopy] = useState('483921');
  const [urlLink, setUrlLink] = useState('https://hassty.com');
  const [callNumber, setCallNumber] = useState('+201080158828');
  const [quickReplyText, setQuickReplyText] = useState('✅ تأكيد الحضور');

  // Media State
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'document' | 'audio'>('image');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop');
  const [mediaCaption, setMediaCaption] = useState('ملخص حصة الفيزياء الأسبوعية 📚✨');
  const [fileName, setFileName] = useState('physic_summary.pdf');

  // Location State
  const [latitude, setLatitude] = useState(30.0444);
  const [longitude, setLongitude] = useState(31.2357);
  const [locationName, setLocationName] = useState('سنتر الأوائل التعليمي');
  const [locationAddress, setLocationAddress] = useState('شارع النصر، المعادي، القاهرة');

  // Reaction State
  const [reactionEmoji, setReactionEmoji] = useState('🔥');
  const [messageId, setMessageId] = useState('');

  // Result & Dispatch State
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const checkStatus = async () => {
    setIsCheckingStatus(true);
    const res = await whatsappService.checkStatus();
    setStatus(res);
    setIsCheckingStatus(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsSending(true);
    setSendResult(null);

    let res: any;

    try {
      if (activeTab === 'text') {
        res = await whatsappService.sendMessage(phone, textMessage);
      } else if (activeTab === 'interactive') {
        const buttons: InteractiveButton[] = [
          {
            type: 'cta_copy',
            text: '📋 نسخ الكود',
            id: 'copy_otp',
            copy_code: otpCodeToCopy,
          },
          {
            type: 'cta_url',
            text: '🌐 فتح المنصة',
            url: urlLink,
          },
          {
            type: 'quick_reply',
            text: quickReplyText,
            id: 'quick_reply_1',
          },
          {
            type: 'cta_call',
            text: '📞 اتصل بنا',
            phone_number: callNumber,
          },
        ];

        res = await whatsappService.sendInteractive({
          number: phone,
          text: textMessage,
          footer: footerText,
          buttons,
        });
      } else if (activeTab === 'list') {
        const sections: InteractiveListSection[] = [
          {
            title: 'الخدمات المتاحة',
            rows: [
              {
                header: 'OTP',
                title: 'إرسال كود التحقق 🔐',
                description: 'إرسال رمز دخول فوري برقم سري',
                id: 'send_otp',
              },
              {
                header: 'Attendance',
                title: 'تسجيل الحضور الفوري 🟢',
                description: 'إشعار فوري بحضور الحصة لولي الأمر',
                id: 'attendance',
              },
              {
                header: 'Support',
                title: 'التواصل مع الدعم الفني 🎧',
                description: 'محادثة مباشرة مع فريق خدمة العملاء',
                id: 'support',
              },
            ],
          },
        ];

        res = await whatsappService.sendInteractiveList({
          number: phone,
          title: 'قائمة خدمات منصة حِصّتي',
          text: 'اختر الخدمة أو الإجراء المطلوب تنفيذه من القائمة أدناه 👇',
          sections,
        });
      } else if (activeTab === 'media') {
        if (mediaType === 'image') {
          res = await whatsappService.sendImage(phone, mediaUrl, mediaCaption);
        } else if (mediaType === 'video') {
          res = await whatsappService.sendVideo(phone, mediaUrl, mediaCaption);
        } else if (mediaType === 'document') {
          res = await whatsappService.sendDocument(phone, mediaUrl, fileName, 'application/pdf');
        } else if (mediaType === 'audio') {
          res = await whatsappService.sendAudio(phone, mediaUrl, true);
        }
      } else if (activeTab === 'location') {
        res = await whatsappService.sendLocation({
          number: phone,
          latitude,
          longitude,
          name: locationName,
          address: locationAddress,
        });
      } else if (activeTab === 'reaction') {
        res = await whatsappService.sendReaction({
          number: phone,
          messageKey: {
            remoteJid: `${phone.replace(/\D/g, '')}@s.whatsapp.net`,
            fromMe: false,
            id: messageId || 'DEMO_ID',
          },
          emoji: reactionEmoji,
        });
      }

      setSendResult(res);
    } catch (err: any) {
      setSendResult({ success: false, error: err?.message || 'Failed to dispatch request' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] py-10 px-4 sm:px-6 lg:px-8 text-right font-['Tajawal',sans-serif]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header with Server Status */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1E3A8A]">
                  مركز إدارة واختبار WhatsApp API ⚡
                </h1>
                <p className="text-xs text-[#6B7280]">
                  إرسال الرسائل التفاعلية، أزرار النسخ، القوائم، والوسائط المتعددة عبر سيرفر Baileys
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">حالة خادم الواتساب:</span>
                {status?.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    متصل وجاهز (Connected)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    غير متصل بالواتساب (Disconnected)
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-gray-400 mt-0.5">
                Target: http://54.85.197.100:3000
              </span>
            </div>

            <button
              onClick={checkStatus}
              disabled={isCheckingStatus}
              title="تحديث الحالة"
              className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Form (8 Cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('interactive')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'interactive'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>أزرار تفاعلية ونسخ (Interactive)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>نص عادي وإيموجي (Text)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>قائمة اختيار (List Select)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('media')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'media'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>الوسائط (صورة/ملف/صوت)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('location')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'location'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>الموقع (Location)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reaction')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'reaction'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>تفاعل (Reaction)</span>
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-5">
              
              {/* Receiver Phone Number */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  رقم الهاتف المستلم (بالصيغة الدولية بدون مسافات أو علامة +)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="201080158828"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs font-mono text-left focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  مثال للرقم المصري: <span className="font-mono text-blue-600 font-bold">201080158828</span>
                </p>
              </div>

              {/* TAB 1: INTERACTIVE BUTTONS & OTP COPY */}
              {activeTab === 'interactive' && (
                <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <div>
                    <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">
                      نص الرسالة الأساسي:
                    </label>
                    <textarea
                      rows={3}
                      value={textMessage}
                      onChange={(e) => setTextMessage(e.target.value)}
                      className="w-full p-3 bg-white border border-blue-200 rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        <span>زر نسخ الكود (cta_copy):</span>
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={otpCodeToCopy}
                        onChange={(e) => setOtpCodeToCopy(e.target.value)}
                        placeholder="483921"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-left focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <Link className="w-3.5 h-3.5 text-blue-600" />
                        <span>زر رابط الموقع (cta_url):</span>
                      </label>
                      <input
                        type="url"
                        dir="ltr"
                        value={urlLink}
                        onChange={(e) => setUrlLink(e.target.value)}
                        placeholder="https://hassty.com"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-left focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                        <span>زر الاتصال الهاتفي (cta_call):</span>
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={callNumber}
                        onChange={(e) => setCallNumber(e.target.value)}
                        placeholder="+201080158828"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-left focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-blue-600" />
                        <span>زر الرد السريع (quick_reply):</span>
                      </label>
                      <input
                        type="text"
                        value={quickReplyText}
                        onChange={(e) => setQuickReplyText(e.target.value)}
                        placeholder="✅ تأكيد الحضور"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      نص التذييل (Footer):
                    </label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PLAIN TEXT */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1F2937]">
                      نص الرسالة (يدعم الأسطر المتعددة، الرموز والإيموجي 🔥):
                    </label>
                    <div className="flex gap-1">
                      {['🔥', '✅', '❤️', '👋', '🎓', '🔐'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setTextMessage((prev) => prev + ' ' + emoji)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full p-3.5 bg-gray-50 border border-[#E5E7EB] rounded-xl text-xs leading-relaxed focus:bg-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              )}

              {/* TAB 3: LIST SELECT */}
              {activeTab === 'list' && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-emerald-900">
                    قائمة تفاعلية (Interactive Single Select List)
                  </div>
                  <p className="text-xs text-gray-600">
                    ستظهر للمستلم كقائمة منسدلة أنيقة يضغط عليها ليختار من بنود الخدمات الثلاثة:
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2 text-xs">
                    <div className="font-bold text-gray-800">1. إرسال كود التحقق 🔐</div>
                    <div className="font-bold text-gray-800">2. تسجيل الحضور الفوري 🟢</div>
                    <div className="font-bold text-gray-800">3. التواصل مع الدعم الفني 🎧</div>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA */}
              {activeTab === 'media' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">نوع الملف:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'image', label: 'صورة', icon: ImageIcon },
                        { id: 'video', label: 'فيديو', icon: Video },
                        { id: 'document', label: 'مستند PDF', icon: FileText },
                        { id: 'audio', label: 'تسجيل صوتي', icon: Mic },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMediaType(item.id as any)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            mediaType === item.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">رابط الملف المباشر (URL):</label>
                    <input
                      type="url"
                      dir="ltr"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-left focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  {mediaType === 'document' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">اسم الملف (File Name):</label>
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">الكابشن / الشرح التوضيحي:</label>
                      <input
                        type="text"
                        value={mediaCaption}
                        onChange={(e) => setMediaCaption(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: LOCATION */}
              {activeTab === 'location' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Latitude:</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Longitude:</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">اسم المكان (Name):</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">العنوان التفصيلي:</label>
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: REACTION */}
              {activeTab === 'reaction' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">اختر الإيموجي:</label>
                    <div className="flex gap-2">
                      {['🔥', '❤️', '👍', '😂', '😮', '😢', '😡'].map((emo) => (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => setReactionEmoji(emo)}
                          className={`text-xl p-2 rounded-xl border transition-all cursor-pointer ${
                            reactionEmoji === emo ? 'bg-amber-100 border-amber-500 scale-110' : 'bg-white border-gray-200'
                          }`}
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">معرف الرسالة (Message ID):</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={messageId}
                      onChange={(e) => setMessageId(e.target.value)}
                      placeholder="MESSAGE_ID"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Submit Dispatch Button */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <span>جاري الإرسال عبر WhatsApp API...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال الرسالة فوراً عبر WhatsApp</span>
                  </>
                )}
              </button>

            </form>

            {/* Send Result Feedback */}
            {sendResult && (
              <div
                className={`p-4 rounded-2xl border text-xs font-bold ${
                  sendResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {sendResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <span>{sendResult.success ? 'تم إرسال الطلب بنجاح إلى WhatsApp Gateway! ✅' : 'فشل إرسال الطلب ❌'}</span>
                </div>
                <pre className="bg-white/80 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto text-left" dir="ltr">
                  {JSON.stringify(sendResult, null, 2)}
                </pre>
              </div>
            )}

          </div>

          {/* WhatsApp Message Live Preview (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#EFEAE2] border border-[#D1D7DB] rounded-3xl p-4 shadow-sm relative overflow-hidden">
              <div className="bg-[#008069] text-white p-3 rounded-2xl flex items-center gap-2 mb-3 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  حِ
                </div>
                <div>
                  <div className="text-xs font-bold">منصة حِصّتي — الدعم الذكي</div>
                  <div className="text-[10px] text-white/80 font-mono" dir="ltr">{phone}</div>
                </div>
              </div>

              {/* Chat Bubble */}
              <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2 border border-gray-100 max-w-full">
                <p className="text-xs text-gray-900 whitespace-pre-line leading-relaxed">
                  {textMessage}
                </p>

                {activeTab === 'interactive' && (
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    {/* Copy Code CTA Button */}
                    <div className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200">
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 نسخ الكود ({otpCodeToCopy})</span>
                    </div>

                    {/* URL CTA Button */}
                    <div className="w-full py-2 px-3 bg-gray-50 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-gray-200">
                      <Link className="w-3.5 h-3.5 text-blue-600" />
                      <span>🌐 فتح المنصة</span>
                    </div>

                    {/* Quick Reply */}
                    <div className="w-full py-2 px-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{quickReplyText}</span>
                    </div>

                    {footerText && (
                      <div className="text-[10px] text-gray-400 text-center pt-1 font-sans">
                        {footerText}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[9px] text-gray-400 text-left font-mono pt-1">
                  12:45 PM ✓✓
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-950">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>دليل التوثيق والتكامل:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800">
                يتم إرسال الطلبات إلى السيرفر الخلفي محلياً (`/api/v1/*`) والذي بدوره يضيف تلقائياً مفتاح `X-API-Key: CHANGE_THIS_SECRET_KEY` إلى خادم Baileys الخارجي، لحماية المفتاح السري ومنع ظهوره في المتصفح.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
