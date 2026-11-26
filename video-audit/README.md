# 视频内容自动审核工具

把视频交给它，自动检查画面、画面里的文字和语音，按你定的规则给出结论：

- **通过**：没发现问题
- **人工复核**：有疑点，或某一段没能审完，需要人看一眼
- **不通过**：发现明确、严重的违规（比如色情、血腥、违禁品）

每个视频生成一份 HTML 报告（结论、时间轴、疑点截图和理由，手机上也能看）和一份 JSON（方便接入你自己的系统）；批量审核时另有 `summary.csv` 汇总。

## 工作原理

1. 用 ffmpeg 抽帧：默认每 2 秒一帧，镜头切换的地方额外补一帧；视频很长时会自动拉大间隔，单个视频最多 120 帧。
2. 语音转成文字：提供字幕文件，或安装 faster-whisper 在本机转写。两样都没有时只审画面，报告里会注明。
3. 每 12 帧一组，连同这段时间的语音文字，交给 Claude（默认 `claude-opus-5-5`）按 `policy.yaml` 里的规则检查，按固定的 JSON 格式返回结果。
4. 把各段的结果合并（同一类问题、时间挨着的合成一条），按规则算出结论。

## 安装

需要 Python 3.10+ 和 ffmpeg 5.1+。

```bash
cd video-audit
pip install -r requirements.txt
# 可选：用来审核语音（第一次运行会下载语音识别模型）
pip install faster-whisper

export ANTHROPIC_API_KEY=你的密钥
```

ffmpeg 安装方法：macOS 用 `brew install ffmpeg`，Ubuntu 用 `sudo apt install ffmpeg`，Windows 从 ffmpeg.org 下载后加到 PATH。

## 用法

```bash
# 审一个视频，报告写到 audit-reports/
python -m video_audit 视频.mp4

# 审一整个文件夹（会递归查找），报告写到 reports/
python -m video_audit ./待审视频 -o reports

# 带上字幕文件（多个视频时，把同名 .srt / .vtt 放在视频旁边就会自动使用）
python -m video_audit 视频.mp4 --subtitles 视频.srt

# 先看看会抽多少帧、发几次请求、大概花多少钱，不调用 API
python -m video_audit ./待审视频 --dry-run
```

常用参数：

| 参数 | 默认 | 说明 |
|---|---|---|
| `--policy` | 自带的 `policy.yaml` | 审核规则文件 |
| `--interval` | 2 | 每隔几秒抽一帧，越小越细，费用越高 |
| `--max-frames` | 120 | 每个视频最多抽几帧 |
| `--scene` | 0.3 | 镜头切换补帧的灵敏度，0 关闭 |
| `--model` | `claude-opus-5-5` | 想省钱可以用 `claude-sonnet-5-5` |
| `--effort` | medium | 模型思考力度：low / medium / high / xhigh / max |
| `--audio` | auto | auto：装了 faster-whisper 就转写；whisper：必须转写；off：不审语音 |
| `--language` | 自动 | 语音语言，如 `zh`、`vi`、`en` |
| `--concurrency` | 4 | 同时发几个请求 |
| `--no-fallback` | 关 | 主模型因安全策略拒答时，默认由服务端自动换模型重试；加这个参数就不换 |

完整参数见 `python -m video_audit --help`。

### 退出码（方便接入脚本或流水线）

| 退出码 | 含义 |
|---|---|
| 0 | 全部通过 |
| 1 | 有需要人工复核的 |
| 2 | 有不通过的 |
| 3 | 有视频处理失败（文件损坏、密钥错误等） |

## 自定义审核规则

复制一份 `policy.yaml` 改，然后用 `--policy 我的规则.yaml` 指定。每个类别：

```yaml
- id: ad_diversion          # 英文编号
  name: 广告导流             # 报告里显示的名字
  action: review            # reject：严重且有把握时直接不通过；review：只送人工复核
  description: 引导用户离开平台私下交易或联系……
  examples: [手机号, 微信号, 二维码]      # 可选
  exceptions: [平台允许的商品橱窗]        # 可选：不算违规的情况
```

- `thresholds.reject_confidence`（默认 0.8）：`action: reject` 的类别里，严重度为「严重」且置信度达到这个值，才直接判不通过，其余都送人工复核。
- `thresholds.review_confidence`（默认 0.4）：低于这个置信度的疑点不计入结论（报告里仍会列出，标为「已忽略」）。
- `extra_instructions`：写给模型的补充说明，比如发布平台、目标市场、业务上的特殊要求。

## 费用和速度

费用主要看抽了多少帧。按默认设置，一张 1080p 的帧约 800 token；规则部分每段都一样，会走提示缓存，按缓存价计费。按 `--dry-run` 的粗估，一个 1 分钟的 1080p 视频（30 帧、3 次请求）用 `claude-opus-5-5` 约 0.16–0.34 美元，用 `claude-sonnet-5-5` 约减半。这只是估算：模型思考和输出的量每次不同，以账单为准。报告里会写出这次实际用掉的 token 和估算费用。

想更便宜：调大 `--interval`、用 `--model claude-sonnet-5-5`、或 `--effort low`。想更细：调小 `--interval`、调大 `--max-frames`。

## 需要知道的局限

- **只看抽出来的帧**：两帧之间一闪而过的画面可能漏掉。对高风险内容可以调小 `--interval`。
- **语音只看文字**：不判断背景音乐的版权，也听不出语气和音效。
- **AI 会出错**：会有误判和漏判。「不通过」和「人工复核」的内容建议都由人确认后再处理，不要直接用来封号或删除。
- **数据去向**：抽出的画面和语音文字会发送到 Anthropic API 进行分析；语音转写（faster-whisper）在本机完成。
- 某一段被模型拒绝审核（通常是内容高度敏感）或请求失败时，整个视频会标为「人工复核」，不会当作通过。

## 运行测试

```bash
pip install pytest
python -m pytest tests
```

测试用的是本地生成的测试视频和模拟的 API，不需要密钥，也不产生费用。

## 文件结构

```
video-audit/
├── policy.yaml              默认审核规则
├── requirements.txt
├── video_audit/
│   ├── cli.py               命令行入口
│   ├── pipeline.py          单个视频的审核流程
│   ├── media.py             读取视频信息、抽帧（ffmpeg）
│   ├── transcript.py        字幕解析、本机语音转写
│   ├── policy.py            规则读取、给模型的规则和输出格式
│   ├── moderator.py         调用 Claude 审核一段
│   ├── verdict.py           合并疑点、给出结论
│   └── report.py            JSON / HTML 报告
└── tests/
```
