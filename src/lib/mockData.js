/**
 * Mock 数据中心 — 所有前端假数据的唯一来源
 * 整合 mock/ 下的文件，补充数据库所需的缺失实体
 */
import { mockActivities, mockSessions, categories, categoryTypes } from '../../mock/mockActivities.js'
import { mockBookings, mockFollowing, mockMyRecords, mockPublished } from '../../mock/mockBookings.js'
import { mockRecords, myCompletedExperiences } from '../../mock/mockRecords.js'
import { mockSystemMessages, mockGroups, mockConversations } from '../../mock/mockMessages.js'
import { mockTimeline } from '../../mock/mockTimeline.js'

// ── 补充实体 ──────────────────────────────────────────

export const mockProfiles = [
  { id: 'u0', numeric_id: 10000, nickname: '超级管理员', role: 'superadmin', avatar: 'https://picsum.photos/seed/admin/200/200', bio: '去玩社区管理员', email: 'admin@quwan.local', created_at: '2026-05-01T00:00:00+08:00' },
  { id: 'u1', numeric_id: 10001, nickname: '小野同学', role: 'user', avatar: 'https://picsum.photos/seed/user1/100/100', bio: '热爱生活，探索世界', email: 'u1@quwan.local', created_at: '2026-05-02T00:00:00+08:00' },
  { id: 'u2', numeric_id: 10002, nickname: '花间集', role: 'user', avatar: 'https://picsum.photos/seed/user2/100/100', bio: '让每个人都能感受花艺之美', email: 'u2@quwan.local', created_at: '2026-05-03T00:00:00+08:00' },
  { id: 'u3', numeric_id: 10003, nickname: '烘焙达人David', role: 'user', avatar: 'https://picsum.photos/seed/user3/100/100', bio: '用双手创造面包的魔法', email: 'u3@quwan.local', created_at: '2026-05-04T00:00:00+08:00' },
  { id: 'u4', numeric_id: 10004, nickname: '文艺青年小李', role: 'user', avatar: 'https://picsum.photos/seed/user4/100/100', bio: '文艺青年，热爱艺术', email: 'u4@quwan.local', created_at: '2026-05-05T00:00:00+08:00' },
  { id: 'u5', numeric_id: 10005, nickname: '摄影爱好者老张', role: 'user', avatar: 'https://picsum.photos/seed/user5/100/100', bio: '用镜头记录生活', email: 'u5@quwan.local', created_at: '2026-05-06T00:00:00+08:00' },
  { id: 'u6', numeric_id: 10006, nickname: '瑜伽达人米卡', role: 'user', avatar: 'https://picsum.photos/seed/user6/100/100', bio: '瑜伽爱好者', email: 'u6@quwan.local', created_at: '2026-05-07T00:00:00+08:00' },
  { id: 'u7', numeric_id: 10007, nickname: '陶艺手作阿杰', role: 'user', avatar: 'https://picsum.photos/seed/user7/100/100', bio: '陶艺爱好者的聚集地', email: 'u7@quwan.local', created_at: '2026-05-08T00:00:00+08:00' },
]

export const mockFollows = [
  { follower_id: 'u0', user_id: 'u2' },
  { follower_id: 'u0', user_id: 'u3' },
  { follower_id: 'u0', user_id: 'u5' },
  { follower_id: 'u0', user_id: 'u7' },
  { follower_id: 'u1', user_id: 'u2' },
  { follower_id: 'u2', user_id: 'u1' },
]

export const mockSaves = [
  { user_id: 'u0', record_id: 'r1' },
  { user_id: 'u0', record_id: 'r2' },
  { user_id: 'u0', record_id: 'r3' },
  { user_id: 'u0', record_id: 'r5' },
]

export const mockGroupMessages = [
  { id: 'gm1', session_id: 's1', user_id: 'u0', content: '大家好，欢迎加入咖啡师体验群！', created_at: '2026-06-13T10:00:00+08:00' },
  { id: 'gm2', session_id: 's1', user_id: 'u1', content: '明天记得早点到哦', created_at: '2026-06-13T11:00:00+08:00' },
  { id: 'gm3', session_id: 's1', user_id: 'u3', content: '请问需要自带工具吗？', created_at: '2026-06-13T11:30:00+08:00' },
  { id: 'gm4', session_id: 's3', user_id: 'u2', content: '花材已经准备好了，大家放心～', created_at: '2026-06-12T09:00:00+08:00' },
  { id: 'gm5', session_id: 's3', user_id: 'u4', content: '请问需要自带花材吗？', created_at: '2026-06-12T09:30:00+08:00' },
  { id: 'gm6', session_id: 's4', user_id: 'u3', content: '今天的面团发酵得特别好', created_at: '2026-06-11T08:00:00+08:00' },
  { id: 'gm7', session_id: 's5', user_id: 'u7', content: '拉坯真是太解压了', created_at: '2026-06-10T14:00:00+08:00' },
  // 群聊级别（group_id 匹配）
  { id: 'gm-g1', group_id: 'g-a1', user_id: 'u0', content: '欢迎加入咖啡师体验群聊 ☕', created_at: '2026-06-15T08:00:00+08:00' },
  { id: 'gm-g2', group_id: 'g-a1', user_id: 'u1', content: '大家好，我是小野同学', created_at: '2026-06-15T08:05:00+08:00' },
  { id: 'gm-g3', group_id: 'g-a1', user_id: 'u3', content: '期待和大家一起体验咖啡', created_at: '2026-06-15T08:10:00+08:00' },
  { id: 'gm-g4', group_id: 'g-a2', user_id: 'u2', content: '花艺课下周开始，好期待', created_at: '2026-06-14T14:00:00+08:00' },
  { id: 'gm-g5', group_id: 'g-a2', user_id: 'u0', content: '记得带一支自己喜欢的花来', created_at: '2026-06-14T14:30:00+08:00' },
  { id: 'gm-g6', group_id: 'g-a4', user_id: 'u0', content: '茶园集合时间是早上8点', created_at: '2026-06-13T20:00:00+08:00' },
  { id: 'gm-g7', group_id: 'g-a4', user_id: 'u5', content: '好的，我会准时到', created_at: '2026-06-13T20:10:00+08:00' },
  { id: 'gm-g8', group_id: 'g-a3-s4', user_id: 'u3', content: '木工坊的工具真齐全', created_at: '2026-06-12T15:00:00+08:00' },
  { id: 'gm-g9', group_id: 'g-a3-s4', user_id: 'u0', content: '第一次做木勺，好紧张', created_at: '2026-06-12T15:30:00+08:00' },
  { id: 'gm-g10', group_id: 'g-a5-s5', user_id: 'u7', content: '拉坯真的会上瘾', created_at: '2026-06-11T16:00:00+08:00' },
  { id: 'gm-g11', group_id: 'g-a5-s5', user_id: 'u0', content: '你的杯子烧出来超好看', created_at: '2026-06-11T17:00:00+08:00' },
]

export const mockPrivateMessages = [
  { id: 'dm1', from_user: 'u1', to_user: 'u0', content: '你好，请问体验需要准备什么吗？', created_at: '2026-06-14T17:00:00+08:00', read: true },
  { id: 'dm2', from_user: 'u0', to_user: 'u1', content: '什么都不用带，我们会准备好所有材料', created_at: '2026-06-14T17:05:00+08:00', read: true },
  { id: 'dm3', from_user: 'u3', to_user: 'u0', content: '谢谢你的推荐，我已经预约了', created_at: '2026-06-14T16:00:00+08:00', read: true },
  { id: 'dm4', from_user: 'u7', to_user: 'u0', content: '明天一起去吗？', created_at: '2026-06-14T15:00:00+08:00', read: false },
  { id: 'dm5', from_user: 'u4', to_user: 'u0', content: '那个体验真的很棒！', created_at: '2026-06-13T20:00:00+08:00', read: true },
  { id: 'dm6', from_user: 'u5', to_user: 'u0', content: '下周的烘焙体验你还有名额吗？', created_at: '2026-06-13T18:00:00+08:00', read: false },
  { id: 'dm7', from_user: 'u2', to_user: 'u0', content: '花艺课的作品照片发你', created_at: '2026-06-16T20:30:00+08:00', read: true },
  { id: 'dm8', from_user: 'u0', to_user: 'u2', content: '拍得真好！可以发到记录里', created_at: '2026-06-16T20:35:00+08:00', read: true },
  { id: 'dm9', from_user: 'u2', to_user: 'u0', content: '好的，我整理一下发', created_at: '2026-06-16T20:36:00+08:00', read: false },
  { id: 'dm10', from_user: 'u3', to_user: 'u0', content: '昨天的烘焙课太棒了', created_at: '2026-06-16T18:00:00+08:00', read: true },
  { id: 'dm11', from_user: 'u0', to_user: 'u3', content: '哈哈，你的可颂做得最好', created_at: '2026-06-16T18:05:00+08:00', read: true },
  { id: 'dm12', from_user: 'u3', to_user: 'u0', content: '主要是老师教得好👍', created_at: '2026-06-16T18:10:00+08:00', read: false },
  { id: 'dm13', from_user: 'u7', to_user: 'u0', content: '陶艺课名额还有吗？我想带朋友来', created_at: '2026-06-16T14:00:00+08:00', read: true },
  { id: 'dm14', from_user: 'u0', to_user: 'u7', content: '有的，还剩3个名额', created_at: '2026-06-16T14:05:00+08:00', read: true },
  { id: 'dm15', from_user: 'u7', to_user: 'u0', content: '太好了，我马上预约', created_at: '2026-06-16T14:06:00+08:00', read: true },
  { id: 'dm16', from_user: 'u5', to_user: 'u0', content: '茶园的照片我发朋友圈了，好多人问', created_at: '2026-06-16T10:00:00+08:00', read: true },
  { id: 'dm17', from_user: 'u0', to_user: 'u5', content: '哈哈，帮我们宣传一下', created_at: '2026-06-16T10:02:00+08:00', read: true },
  { id: 'dm18', from_user: 'u4', to_user: 'u0', content: '下次木工体验什么时候开？', created_at: '2026-06-15T19:00:00+08:00', read: false },
  { id: 'dm19', from_user: 'u1', to_user: 'u0', content: '我写了个体验记录，你看看', created_at: '2026-06-16T12:00:00+08:00', read: true },
  { id: 'dm20', from_user: 'u0', to_user: 'u1', content: '写得很棒，我给你推荐了', created_at: '2026-06-16T12:05:00+08:00', read: true },
]

export const mockGroupMembers = [
  // 角色层级：superadmin > admin > organizer > member
  // 期次级（session-based groups）
  { session_id: 's1', user_id: 'u0', role: 'superadmin', order: 1 },
  { session_id: 's1', user_id: 'u1', role: 'member', order: 2 },
  { session_id: 's1', user_id: 'u3', role: 'member', order: 3 },
  { session_id: 's3', user_id: 'u0', role: 'superadmin', order: 1 },
  { session_id: 's3', user_id: 'u2', role: 'organizer', order: 2 },
  { session_id: 's3', user_id: 'u4', role: 'member', order: 3 },
  { session_id: 's4', user_id: 'u0', role: 'superadmin', order: 1 },
  { session_id: 's4', user_id: 'u3', role: 'member', order: 2 },
  { session_id: 's5', user_id: 'u0', role: 'superadmin', order: 1 },
  { session_id: 's5', user_id: 'u7', role: 'member', order: 2 },
  { session_id: 's6', user_id: 'u0', role: 'superadmin', order: 1 },
  { session_id: 's7', user_id: 'u0', role: 'superadmin', order: 1 },
  { session_id: 's7', user_id: 'u5', role: 'admin', order: 2 },
  // 群聊级别（activity-based groups）
  { group_id: 'g-a1', user_id: 'u0', role: 'superadmin', order: 1 },
  { group_id: 'g-a1', user_id: 'u1', role: 'member', order: 2 },
  { group_id: 'g-a1', user_id: 'u3', role: 'member', order: 3 },
  { group_id: 'g-a2', user_id: 'u0', role: 'superadmin', order: 1 },
  { group_id: 'g-a2', user_id: 'u2', role: 'organizer', order: 2 },
  { group_id: 'g-a2', user_id: 'u4', role: 'member', order: 3 },
  { group_id: 'g-a4', user_id: 'u0', role: 'superadmin', order: 1 },
  { group_id: 'g-a4', user_id: 'u5', role: 'member', order: 2 },
  { group_id: 'g-a3-s4', user_id: 'u0', role: 'superadmin', order: 1 },
  { group_id: 'g-a3-s4', user_id: 'u3', role: 'member', order: 2 },
  { group_id: 'g-a5-s5', user_id: 'u0', role: 'superadmin', order: 1 },
  { group_id: 'g-a5-s5', user_id: 'u7', role: 'member', order: 2 },
]

export const mockInviteCodes = [
  { id: 'ic1', code: 'QUWAN2026', max_uses: 10, used_count: 3, is_active: true, created_by: 'u0', note: '内测邀请', created_at: '2026-06-01T00:00:00+08:00' },
  { id: 'ic2', code: 'DALIART', max_uses: 5, used_count: 5, is_active: false, created_by: 'u0', note: '大理艺术圈', created_at: '2026-06-10T10:00:00+08:00' },
  { id: 'ic3', code: 'COFFEE01', max_uses: 20, used_count: 0, is_active: true, created_by: 'u0', note: '咖啡爱好者', created_at: '2026-06-15T08:00:00+08:00' },
]

export const mockNotifications = [
  { id: 'n1', type: 'publish_review', title: '【发布审核】', desc: '6月10日 14:00 · 苍山徒步一日游审核通过', time: '6月10日', is_read: true, unread_count: 0, created_at: '2026-06-10T14:00:00+08:00', payload: { items: [{ activity: '苍山徒步一日游', activity_id: 'a16', result: '审核通过', time: '6月10日 14:00' }, { activity: '夜观星象活动', activity_id: 'a17', result: '未通过', reason: '活动内容不够详实，请补充描述', time: '6月9日 14:00' }] } },
  { id: 'n2', type: 'booking_request', title: '【预约请求】', desc: '6月13日 20:00 · 小野同学预约了咖啡师一日体验', time: '6月13日', is_read: false, unread_count: 4, created_at: '2026-06-13T20:00:00+08:00', payload: { items: [{ user: '小野同学', user_id: 'u1', avatar: 'https://picsum.photos/seed/user1/100/100', activity: '咖啡师一日体验', activity_id: 'a1', session: '第1期', activityTime: '6月20日 09:00', name: '王小明', phone: '13812345678', gender: '女', age: '25', withFamily: false, note: '第一次体验咖啡制作，非常期待', time: '6月13日 20:00' }, { user: '烘焙达人David', user_id: 'u3', avatar: 'https://picsum.photos/seed/user3/100/100', activity: '木工坊手工木勺', activity_id: 'a3', session: '第1期', activityTime: '6月22日 14:00', name: '李大卫', phone: '13987654321', gender: '男', age: '32', withFamily: true, note: '带家属一起来体验', time: '6月12日 18:00' }, { user: '文艺青年小李', user_id: 'u4', avatar: 'https://picsum.photos/seed/user4/100/100', activity: '花艺设计师一日体验', activity_id: 'a2', session: null, name: '李文艺', phone: '13611112222', gender: '女', age: '28', withFamily: false, customTime: '6月18日 14:00', note: '想体验插花艺术', time: '6月15日 10:00' }, { user: '摄影爱好者老张', user_id: 'u5', avatar: 'https://picsum.photos/seed/user5/100/100', activity: '茶园采茶制茶体验', activity_id: 'a4', session: null, name: '张建国', phone: '13788889999', gender: '男', age: '45', withFamily: false, customTime: '6月25日 全天', note: '退休后想多体验一些手工劳动', time: '6月16日 08:00' }] } },
  { id: 'n3', type: 'booking_result', title: '【预约结果】', desc: '6月16日 08:00 · 预约已发送，等待发布人确认', time: '6月16日', is_read: false, unread_count: 5, created_at: '2026-06-14T10:00:00+08:00', payload: { items: [{ activity: '咖啡师一日体验', session: '第1期', result: '已通过', name: '王小明', phone: '13812345678', gender: '女', age: '25', withFamily: false, note: '第一次体验咖啡制作', time: '6月14日 10:00' }, { activity: '白族扎染体验', session: '第2期', result: '未通过', name: '王小明', phone: '13812345678', gender: '女', age: '25', withFamily: false, note: '', time: '6月14日 10:00' }, { activity: '花艺设计师一日体验', session: '', result: '预约已取消（被移出群聊）', name: '王小明', phone: '13812345678', gender: '女', age: '25', withFamily: false, note: '', time: '6月14日 15:00' }, { activity: '茶园采茶制茶体验', session: null, result: '待审核', customTime: '6月25日 全天', name: '张建国', phone: '13788889999', gender: '男', age: '45', withFamily: false, note: '退休后想多体验一些手工劳动', time: '6月16日 08:00' }, { activity: '陶艺拉坯入门', session: '第1期', result: '待审核', activityTime: '6月28日 10:00', name: '张建国', phone: '13788889999', gender: '男', age: '45', withFamily: false, note: '想学陶艺', time: '6月16日 09:00' }] } },
  { id: 'n4', type: 'follow_notify', title: '【关注提醒】', desc: '6月13日 08:00 · 小野同学、David、老张关注了你', time: '6月13日', is_read: false, unread_count: 1, created_at: '2026-06-13T08:00:00+08:00', payload: { items: [{ name: '小野同学', avatar: 'https://picsum.photos/seed/user1/100/100', user_id: 'u1', time: '6月13日 08:00' }, { name: '烘焙达人David', avatar: 'https://picsum.photos/seed/user3/100/100', user_id: 'u3', time: '6月13日 08:00' }, { name: '摄影爱好者老张', avatar: 'https://picsum.photos/seed/user5/100/100', user_id: 'u5', time: '6月13日 08:00' }] } },
  { id: 'n5', type: 'save_notify', title: '【收藏提醒】', desc: '6月11日 16:00 · 花间集收藏了你的记录', time: '6月11日', is_read: false, unread_count: 2, created_at: '2026-06-11T16:00:00+08:00', payload: { items: [{ user: '花间集', user_id: 'u2', avatar: 'https://picsum.photos/seed/user2/100/100', record: '白族扎染的蓝，像大理的天', recordId: 'r1', images: ['https://picsum.photos/seed/rec1a/200/120', 'https://picsum.photos/seed/rec1b/200/120', 'https://picsum.photos/seed/rec1c/200/120'], time: '6月11日 16:00' }, { user: '陶艺手作阿杰', user_id: 'u7', avatar: 'https://picsum.photos/seed/user7/100/100', record: '第一次做陶艺，手忙脚乱', recordId: 'r2', images: ['https://picsum.photos/seed/rec2a/200/120', 'https://picsum.photos/seed/rec2b/200/120', 'https://picsum.photos/seed/rec2c/200/120'], time: '6月8日 20:00' }] } },
  { id: 'n6', type: 'featured_notify', title: '【推荐提醒】', desc: '6月15日 10:00 · 咖啡师一日体验已推荐到首页', time: '6月15日', is_read: false, unread_count: 1, created_at: '2026-06-15T10:00:00+08:00', payload: { activity: '咖啡师一日体验', activity_id: 'a1', position: '轮播位', images: ['https://picsum.photos/seed/f1a/200/120', 'https://picsum.photos/seed/f1b/200/120', 'https://picsum.photos/seed/f1c/200/120'], time: '6月15日 10:00' } },
  { id: 'n7', type: 'route_notify', title: '【研学路线】', desc: '6月13日 10:00 · 白族民俗文化研学关联了你的活动', time: '6月13日', is_read: false, unread_count: 1, created_at: '2026-06-13T10:00:00+08:00', payload: { route_id: 'a20', route_title: '白族民俗文化研学', route_time: '6月13日 10:00', my_activities: ['白族扎染手艺传承人体验', '木工坊手工木勺制作'], my_approval: null, all_approved: false, total_organizers: 2, approved_count: 0, stops: [{ activity: '咖啡师一日体验', activity_id: 'a1', status: '已同意' }, { activity: '白族扎染手艺传承人体验', activity_id: 'a2', mine: true, status: null }, { activity: '木工坊手工木勺制作', activity_id: 'a3', mine: true, status: null }, { activity: '手工皮具体验', activity_id: 'a8', status: null }, { activity: '陶艺拉坯入门', activity_id: 'a5', status: null }] } },
]

// mock 评价（必须在 store 之前定义）
export const mockReviews = [
  { id: 'rv1', activity_id: 'a1', user_id: 'u1', user_nickname: '小野同学', user_avatar: 'https://picsum.photos/seed/user1/100/100', rating: 5, content: '阿麦师傅超有耐心，孩子第一次揉面就爱上了！回家还念叨着要自己做面包，强烈推荐。', created_at: '2026-06-10T14:00:00+08:00' },
  { id: 'rv2', activity_id: 'a1', user_id: 'u3', user_nickname: '烘焙达人David', user_avatar: 'https://picsum.photos/seed/user3/100/100', rating: 5, content: '柴火窑烤出来的面包真的太香了，完全不一样的体验。阿麦师傅对自然发酵的理解很深，学了不少东西。', created_at: '2026-06-08T10:00:00+08:00' },
  { id: 'rv3', activity_id: 'a2', user_id: 'u4', user_nickname: '文艺青年小李', user_avatar: 'https://picsum.photos/seed/user4/100/100', rating: 4, content: '扎染真的很神奇，看着白布一点点变蓝，图案慢慢显现，非常有成就感。传承人讲了很多白族的文化故事。', created_at: '2026-06-05T16:00:00+08:00' },
]

// ── 内存状态（可读写） ────────────────────────────────
const store = {
  activities: JSON.parse(JSON.stringify(mockActivities)),
  activity_sessions: JSON.parse(JSON.stringify(mockSessions)),
  profiles: JSON.parse(JSON.stringify(mockProfiles)),
  bookings: JSON.parse(JSON.stringify(mockBookings.map(b => ({
    id: b.id, activity_id: b.activity_id, session_id: b.session_id, user_id: 'u0',
    count: 1, contact: '138xxxx1234', note: '第一次体验', status: 'pending',
    reject_reason: null, created_at: new Date().toISOString(),
  })))),
  records: JSON.parse(JSON.stringify(mockRecords)),
  saves: JSON.parse(JSON.stringify(mockSaves)),
  follows: JSON.parse(JSON.stringify(mockFollows)),
  notifications: JSON.parse(JSON.stringify(mockNotifications)),
  group_members: JSON.parse(JSON.stringify(mockGroupMembers)),
  group_messages: JSON.parse(JSON.stringify(mockGroupMessages)),
  messages: JSON.parse(JSON.stringify(mockPrivateMessages)),
  invite_codes: JSON.parse(JSON.stringify(mockInviteCodes)),
  reviews: JSON.parse(JSON.stringify(mockReviews)),
  drafts: [
    { id: 'd1', title: '小小酿酒师体验', category: '食品', contentType: '职业体验', city: '大理', industry: '手作农业/食品', description: '体验酿酒全过程', applicants_count: 0, cover_url: 'https://picsum.photos/seed/draft1/400/300', updated_at: '6月14日' },
    { id: 'd2', title: '洱海骑行一日游', category: '户外', contentType: '研学路线', city: '大理', industry: '户外运动', description: '环洱海骑行', applicants_count: 0, cover_url: 'https://picsum.photos/seed/draft2/400/300', updated_at: '6月12日' },
  ],
}

export const mockStore = store

// 添加期次到内存 store
export function addMockSession(activityId, sessionData) {
  const existing = store.activity_sessions.filter(s => s.activity_id === activityId)
  const newNumber = Math.max(0, ...existing.map(s => s.session_number)) + 1
  const session = {
    id: `s_dyn_${Date.now()}`,
    activity_id: activityId,
    session_number: newNumber,
    booking_start_time: sessionData.bookingStart || new Date().toISOString(),
    booking_end_time: sessionData.bookingEnd || new Date(Date.now() + 7*86400000).toISOString(),
    planned_start_time: sessionData.startTime,
    end_time: sessionData.endTime,
    capacity: sessionData.capacity || 10,
    price: sessionData.price || 0,
    status: null,
    group_chat_name: sessionData.groupName || `第${newNumber}期`,
    booked_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  store.activity_sessions.push(session)
  return session
}

// 重置 store 到初始 mock 数据（下拉刷新用）
export function refreshMockStore() {
  store.activities = JSON.parse(JSON.stringify(mockActivities))
  store.activity_sessions = JSON.parse(JSON.stringify(mockSessions))
  store.profiles = JSON.parse(JSON.stringify(mockProfiles))
  store.bookings = JSON.parse(JSON.stringify(mockBookings.map(b => ({
    id: b.id, activity_id: b.activity_id, session_id: b.session_id, user_id: 'u0',
    count: 1, contact: '138xxxx1234', note: '第一次体验', status: 'pending',
    reject_reason: null, created_at: new Date().toISOString(),
  }))))
  store.records = JSON.parse(JSON.stringify(mockRecords))
  store.saves = JSON.parse(JSON.stringify(mockSaves))
  store.follows = JSON.parse(JSON.stringify(mockFollows))
  store.notifications = JSON.parse(JSON.stringify(mockNotifications))
  store.group_members = JSON.parse(JSON.stringify(mockGroupMembers))
  store.group_messages = JSON.parse(JSON.stringify(mockGroupMessages))
  store.messages = JSON.parse(JSON.stringify(mockPrivateMessages))
  store.invite_codes = JSON.parse(JSON.stringify(mockInviteCodes))
  store.reviews = JSON.parse(JSON.stringify(mockReviews))
  store.drafts = [
    { id: 'd1', title: '小小酿酒师体验', category: '食品', contentType: '职业体验', city: '大理', industry: '手作农业/食品', description: '体验酿酒全过程', applicants_count: 0, cover_url: 'https://picsum.photos/seed/draft1/400/300', updated_at: '6月14日' },
    { id: 'd2', title: '洱海骑行一日游', category: '户外', contentType: '研学路线', city: '大理', industry: '户外运动', description: '环洱海骑行', applicants_count: 0, cover_url: 'https://picsum.photos/seed/draft2/400/300', updated_at: '6月12日' },
  ]
}

// 直接导出 mock 原始数据
export { mockActivities, mockSessions, categories, categoryTypes }
export { mockBookings, mockFollowing, mockMyRecords, mockPublished }
export { mockRecords, myCompletedExperiences }
export { mockSystemMessages, mockGroups, mockConversations }
export { mockTimeline }
