import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import type { RouteInput } from "../../lib/api";

interface RouteFormDialogProps {
  open: boolean;
  pending: boolean;
  title: string;
  submitLabel: string;
  error?: string;
  initialValue?: RouteInput;
  onOpenChange(open: boolean): void;
  onSubmit(value: RouteInput): Promise<void>;
}

const EMPTY_FORM: RouteInput = {
  prefix: "",
  stripPrefix: true,
  targetBaseUrl: "",
  customHeaders: [],
  enabled: true,
};

export function RouteFormDialog(props: RouteFormDialogProps) {
  const [value, setValue] = useState<RouteInput>(props.initialValue ?? EMPTY_FORM);

  useEffect(() => {
    setValue(props.initialValue ?? EMPTY_FORM);
  }, [props.initialValue, props.open]);

  return (
    <Dialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-card"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="dialog-header">
            <div>
              <span className="section-tag">路由编辑</span>
              <Dialog.Title className="dialog-title">{props.title}</Dialog.Title>
              <Dialog.Description className="dialog-description">
                按顺序填写访问前缀、目标地址和附加请求头，保存后规则会立刻出现在列表中。
              </Dialog.Description>
            </div>
            <Dialog.Close className="ghost-button" type="button">
              关闭
            </Dialog.Close>
          </div>

          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              void props.onSubmit(value);
            }}
          >
            <label className="field">
              <span>前缀</span>
              <input
                value={value.prefix}
                onChange={(event) => setValue({ ...value, prefix: event.target.value })}
                placeholder="/dav"
              />
              <p className="field-hint">访问这个前缀时，请求会命中当前这条转发规则。</p>
            </label>

            <label className="field">
              <span>目标基地址</span>
              <input
                value={value.targetBaseUrl}
                onChange={(event) =>
                  setValue({ ...value, targetBaseUrl: event.target.value })
                }
                placeholder="https://dav.example.com/root"
              />
              <p className="field-hint">这里填写远端 WebDAV 服务的固定基地址。</p>
            </label>

            <div className="field">
              <span>路径处理方式</span>
              <div className="segmented-control">
                <button
                  className={value.stripPrefix ? "segment is-active" : "segment"}
                  onClick={() => setValue({ ...value, stripPrefix: true })}
                  type="button"
                >
                  去除前缀
                </button>
                <button
                  className={!value.stripPrefix ? "segment is-active" : "segment"}
                  onClick={() => setValue({ ...value, stripPrefix: false })}
                  type="button"
                >
                  保留前缀
                </button>
              </div>
              <p className="field-hint">
                不保留路径前缀时，请求会直接接到目标地址后面；保留时，会把当前访问路径一并带过去。
              </p>
            </div>

            <div className="field">
              <div className="field-inline">
                <span>附加请求头</span>
                <button
                  className="ghost-button"
                  onClick={() =>
                    setValue({
                      ...value,
                      customHeaders: [...value.customHeaders, { name: "", value: "" }],
                    })
                  }
                  type="button"
                >
                  添加一项
                </button>
              </div>

              <p className="field-hint">
                适合放认证信息或上游服务要求的固定请求头。没有需求时可以留空。
              </p>

              <div className="header-list">
                {value.customHeaders.length === 0 ? (
                  <div className="empty-hint">当前没有附加请求头，可按需补充。</div>
                ) : null}

                {value.customHeaders.map((header, index) => (
                  <div className="header-row" key={`${index}-${header.name}`}>
                    <input
                      value={header.name}
                      onChange={(event) => {
                        const next = [...value.customHeaders];
                        next[index] = { ...next[index], name: event.target.value };
                        setValue({ ...value, customHeaders: next });
                      }}
                      placeholder="x-upstream-token"
                    />
                    <input
                      value={header.value}
                      onChange={(event) => {
                        const next = [...value.customHeaders];
                        next[index] = { ...next[index], value: event.target.value };
                        setValue({ ...value, customHeaders: next });
                      }}
                      placeholder="abc123"
                    />
                    <button
                      className="ghost-button"
                      onClick={() =>
                        setValue({
                          ...value,
                          customHeaders: value.customHeaders.filter((_, item) => item !== index),
                        })
                      }
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <label className="checkbox-row">
              <input
                checked={value.enabled}
                onChange={(event) => setValue({ ...value, enabled: event.target.checked })}
                type="checkbox"
              />
              <span>创建后立即启用</span>
            </label>

            {props.error ? <p className="form-error">{props.error}</p> : null}

            <div className="dialog-actions">
              <button className="ghost-button" onClick={() => props.onOpenChange(false)} type="button">
                取消
              </button>
              <button className="primary-button" disabled={props.pending} type="submit">
                {props.pending ? "保存中..." : props.submitLabel}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
