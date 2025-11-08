// 抖音用户字段名映射
export const douyinUserHeaderMap = {
    'itemId': '站内唯一用户id',
    'registerId': '用户注册id',
    'userName': '用户名称',
    'gender': '用户性别',
    'avatarUrl': '用户头像',
    'shareUrl': '用户对外分享链接',
    'birthday': '出生日期',
    'birthYear': '出生年份',
    'registerTimestamp': '用户注册时间',
    'province': '用户所在省',
    'city': '用户所在市',
    'cityLevel': '城市等级',
    'userDesc': '用户简介',
    'isVerified': '是否认证用户',
    'verifiedType': '认证类型',
    'verifiedReason': '认证原因',
    'friendCnt': '用户关注数',
    'followerCnt': '用户粉丝数',
    'videoCnt': '用户发表视频数',
    'likeCnt': '用户获得点赞',
    'collectionCnt': '用户收藏视频数',
    'constellation': '用户星座',
    'friends': '关注列表',
    'followers': '粉丝列表',
    'challenges': '用户参与挑战列表',
    'likeVideoItemIds': '用户喜欢视频列表',
    'contactInfo': '用户联系信息 (手机 / 电话)',
    'address': '用户地址',
    'secUserItemId': '抖音 sec_uid',
    'ipLocation': '用户 IP 归属地',
    'isStarAtlas': '是否入驻',
    'mcn': 'MCN 机构名称',
    'updateTimestamp': '采集时间'
}

// B站用户字段名映射
export const bilibiliUserHeaderMap = {
    'userId': '站内唯一用户 id',
    'userName': '用户名称',
    'avatarUrl': '用户头像链接',
    'itemUrl': '用户主页链接',
    'birthday': '出生日期',
    'hasFollowerBadge': '是否有粉丝徽章',
    'followerCnt': '用户粉丝数',
    'friendCnt': '用户关注数',
    'gender': '用户性别',
    'userLevel': '用户等级',
    'likeCnt': '用户获取点赞数',
    'supportBatteryMonthCnt': '用户当月获取充电数',
    'supportBatteryTotalCnt': '用户获取充电总数',
    'verifiedType': '认证类型',
    'verifiedReason': '用户认证原因',
    'videoPlayCnt': '用户视频获得播放数',
    'userDesc': '用户签名描述',
    'isBlocked': '是否被关小黑屋',
    'bgPicUrl': '用户主页背景图片链接',
    'isVip': '是否 vip',
    'vipType': 'vip 类型',
    'friends': '关注列表',
    'likeVideoItemIds': '点赞视频列表',
    'coinVideoItemIds': '投币视频列表',
    'collectVideoItemIds': '收藏视频列表',
    'likeVideoCnt': '用户主动点赞视频数',
    'collectVideoCnt': '用户主动收藏视频数',
    'postVideoCnt': '用户发表视频数（投稿视频数）',
    'postCnt': '用户发表主题贴数',
    'userTags': '用户标签列表',
    'subscribeAnimeItemIds': '用户订阅番剧列表',
    'subscribeCartoonItemIds': '用户订阅漫画列表',
    'subscribeCinemaItemIds': '用户订阅影视列表',
    'subscribeTags': '用户订阅的标签列表',
    'postViewCnt': '用户文章获得阅读数',
    'supportBatteryUserItemIds': '获得充电用户列表',
    'ipLocation': '用户 IP 归属地',
    'isStarAtlas': '是否入驻',
    'mcn': 'MCN 机构的名称',
    'catId': '分类 id',
    'updateTimestamp': '采集时间'
}

// 根据平台获取用户字段映射
export function getUserHeaderMap(platform) {
    if (platform === 'douyin') {
        return douyinUserHeaderMap
    } else if (platform === 'bilibili') {
        return bilibiliUserHeaderMap
    }
    return {}
}

