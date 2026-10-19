# FocusFill 隐私政策 / Privacy Policy

最后更新：2026-10-20

---

## 中文

### 概述

FocusFill 是一款 Firefox 扩展，用于在网页表单中填充用户自己保存的个人信息。本政策说明 FocusFill 如何处理数据。

**一句话总结：FocusFill 不收集、不传输、不分享任何用户数据。所有数据只保存在你自己的设备上。**

### 数据存储

- 你编辑的规则和填充值保存在浏览器的扩展本地存储 `browser.storage.local` 中。
- 该存储区域由浏览器隔离，网页脚本无法读取。
- 数据不会同步到任何服务器，也不会通过 Firefox 账户同步（除非你自行开启浏览器级别的扩展数据同步，这不在 FocusFill 控制范围内）。

### 网络请求

- FocusFill 不发起任何网络请求。
- 没有服务器、没有账号系统、没有分析、没有追踪、没有崩溃上报。
- 扩展的 manifest 中 `data_collection_permissions.required` 为空数组，表示不收集任何数据。

### 数据收集

FocusFill 不收集以下任何信息：

- 个人身份信息
- 浏览历史
- 网页内容
- 表单填写内容
- 位置信息
- 设备信息
- 使用统计

### 数据共享

FocusFill 不与任何第三方共享数据，因为根本不收集数据。

### 用户控制

- 所有规则和值由你手动编辑并保存。
- 你可以随时在设置页修改或清空数据。
- 卸载扩展会删除全部本地存储的数据。
- 撤销填充（`Alt+Z`）只影响页面上的输入框，不修改你保存的规则。

### 权限说明

| 权限                                        | 用途                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `storage`                                   | 在本地保存你的规则和填充值                                                                                             |
| `host_permissions: http://*/*, https://*/*` | 在网页中识别输入框并显示提示小圆点。扩展只读取当前聚焦输入框的属性和附近文本，不读取页面其他内容，不上传任何页面数据。 |

### 不适用范围

FocusFill 无法在以下页面运行，这是浏览器限制，与隐私无关：

- 浏览器内置页面（`about:`、`chrome://` 等）
- 扩展商店
- 内置 PDF 查看器
- 扩展自身页面（`moz-extension://`）
- 本地文件（`file://`，除非手动授权）

### 政策变更

如果本政策发生变更，会更新本文档顶部的“最后更新”日期，并在仓库中提交记录。

### 联系方式

如有隐私相关问题，请在项目仓库提交 Issue：

<https://github.com/igugyj/FocusFill/issues>

---

## English

### Overview

FocusFill is a Firefox extension that fills web forms with personal information you save locally. This policy explains how FocusFill handles data.

**TL;DR: FocusFill does not collect, transmit, or share any user data. Everything stays on your device.**

### Data Storage

- Rules and fill values you edit are stored in the browser's extension-local storage (`browser.storage.local`).
- This storage area is isolated by the browser and cannot be read by web page scripts.
- Data is not synced to any server, and is not synced through a Firefox account (unless you enable browser-level extension sync yourself, which is outside FocusFill's control).

### Network Requests

- FocusFill makes zero network requests.
- No server, no accounts, no analytics, no tracking, no crash reporting.
- The extension manifest declares `data_collection_permissions.required` as an empty array, meaning no data collection.

### Data Collection

FocusFill does not collect any of the following:

- Personally identifiable information
- Browsing history
- Page content
- Form input values
- Location data
- Device information
- Usage statistics

### Data Sharing

FocusFill does not share data with any third party, because it does not collect any.

### User Control

- All rules and values are manually edited and saved by you.
- You can modify or clear your data at any time in the settings page.
- Uninstalling the extension deletes all locally stored data.
- Undo (`Alt+Z`) only affects input fields on the page; it does not modify your saved rules.

### Permissions

| Permission                                  | Purpose                                                                                                                                                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                   | Save your rules and fill values locally.                                                                                                                                                                         |
| `host_permissions: http://*/*, https://*/*` | Detect input fields on web pages and show a hint dot. The extension only reads attributes of the currently focused input and nearby text. It does not read other page content and does not upload any page data. |

### Out of Scope

FocusFill cannot run on the following pages due to browser restrictions, unrelated to privacy:

- Browser internal pages (`about:`, `chrome://`, etc.)
- Extension galleries
- Built-in PDF viewer
- Extension's own pages (`moz-extension://`)
- Local files (`file://`, unless manually granted)

### Policy Changes

If this policy changes, the "Last updated" date at the top will be revised, and the change will be recorded in the repository commit history.

### Contact

For privacy-related questions, please open an issue in the project repository:

<https://github.com/igugyj/FocusFill/issues>
