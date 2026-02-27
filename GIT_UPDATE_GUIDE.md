## VCPToolBox Git 更新流程（我的自用版本）

> 目标：**不搞乱仓库、不丢本地改动、定期从上游同步最新代码**  
> 仓库路径：`D:\VCP\VCPToolBox`

---

### 1. 仓库远程结构（必须牢记）

- **origin（自己的仓库）**
  - 地址：`https://github.com/TechQ36/VCPToolBox.git`
  - 用途：**只 push 到这里**，相当于“自己的备份 + 自己的改动”

- **upstream（原作者仓库）**
  - 地址：`https://github.com/lioensky/VCPToolBox.git`
  - 用途：**只从这里 fetch / merge**，用来获取原作者的最新更新

命令查看当前配置：

```powershell
cd D:\VCP\VCPToolBox
git remote -v
```

---

### 2. 日常「从 upstream 同步」完整流程（推荐每次都照做）

#### 2.1 确认分支和当前状态

```powershell
cd D:\VCP\VCPToolBox

git branch       # 确认当前在 main
git checkout main

git status       # 看看有没有未提交修改
```

如果 `git status` 显示有很多 `modified` / `untracked`，先决定是 **提交** 还是 **暂存起来**。

#### 2.2 处理本地未提交改动（两选一）

- **方式 A：直接提交（最安全，推荐）**

  ```powershell
  git add .
  git commit -m "local changes before syncing upstream"
  ```

- **方式 B：不想现在提交，用 stash 临时保存**

  ```powershell
  git stash push -u -m "before merge upstream/main"
  ```

  说明：
  - `-u` 会把未跟踪文件也一起保存
  - 合并完再用 `git stash pop` 把改动弹回来

#### 2.3 拉取上游最新代码

```powershell
git fetch upstream
```

可选：先看差异有多大（只看摘要）：

```powershell
git diff main..upstream/main --stat
```

#### 2.4 把 `upstream/main` 合并到本地 `main`

```powershell
git merge upstream/main
```

- 没有冲突 → 直接合并成功
- 有冲突 → Git 会提示哪些文件 `both modified`，进入冲突处理流程（见下一节）

> 注意：**只要还没 `git commit`，这次合并都可以用 `git merge --abort` 放弃。**

---

### 3. 处理合并冲突的固定套路

1. **查看冲突文件列表**

   ```powershell
   git status
   ```

   有冲突的文件会显示为 `both modified` 或 `unmerged paths`。

2. **在编辑器里逐个打开冲突文件**

   文件中会出现类似这样的标记：

   ```text
   <<<<<<< HEAD
   # 这是本地版本（main）
   =======
   # 这是 upstream/main 版本
   >>>>>>> upstream/main
   ```

3. **根据需要手动合并内容**

   - 保留自己需要的部分
   - 也可以把两边内容都保留、稍微修改一下
   - 最后**必须删除所有** `<<<<<<<` / `=======` / `>>>>>>>` 这三种标记行

4. **标记冲突已解决**

   每个处理完的文件都执行一次：

   ```powershell
   git add 这个文件的路径
   ```

5. **所有冲突文件都 `git add` 之后，完成合并提交**

   ```powershell
   git commit -m "merge upstream/main"
   ```

---

### 4. 合并之后：推送到自己的仓库 origin

当本地 `main` 合并完成、状态干净（`git status` 只显示“ahead of 'origin/main' by X commits”）时，可以推到自己的 GitHub 仓库：

```powershell
git push origin main
```

这一步会把：
- 你本地的开发提交
- 同步 upstream/main 的合并提交  

一起推到 `TechQ36/VCPToolBox`，作为你自己的版本历史。

---

### 5. 使用 stash 的收尾动作（如果 2.2 用了方式 B）

如果之前是用 `stash` 临时隐藏改动，同步完 upstream 后需要把改动弹回来：

```powershell
git stash list      # 看看刚才的记录在不在
git stash pop       # 弹出最近一次 stash
```

如果弹出时出现冲突，就按「第 3 节 冲突处理套路」的方式处理，然后：

```powershell
git add 冲突文件
git commit -m "apply stashed changes"
```

---

### 6. 合并搞砸了想回滚：快速止损办法

只要**这次合并还没提交**，可以直接：

```powershell
git merge --abort
```

会回到执行 `git merge upstream/main` 之前的状态。

如果已经提交了，但发现不满意，可以：

```powershell
git log --oneline   # 先看一下历史
```

确认上一条提交哈希后，根据具体情况再决定是 `revert` 还是 `reset`（危险操作，动之前建议先问一嘴再操作）。

---

### 7. 常用命令小抄（记不住时翻这里）

- 查看当前状态：

  ```powershell
  git status
  ```

- 查看当前分支：

  ```powershell
  git branch
  ```

- 查看远程：

  ```powershell
  git remote -v
  ```

- 从 upstream 拉最新但不合并：

  ```powershell
  git fetch upstream
  ```

- 把 upstream/main 合并到当前分支：

  ```powershell
  git merge upstream/main
  ```

- 推送到自己的仓库：

  ```powershell
  git push origin main
  ```

> 如果以后你的习惯/流程变了，可以在这个文件继续追加自己的笔记，**只对自己负责就行**。

