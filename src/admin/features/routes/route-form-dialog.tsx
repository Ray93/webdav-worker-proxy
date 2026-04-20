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
        <Dialog.Content className="dialog-card">
          <div className="dialog-header">
            <div>
              <Dialog.Title className="dialog-title">{props.title}</Dialog.Title>
              <Dialog.Description className="dialog-description">
                配置请求路径前缀、目标基地址和需要追加到上游的自定义请求头。
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
            </label>

            <div className="field">
              <span>路径策略</span>
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
                去除前缀时，转发到目标基地址；保留前缀时，将匹配前缀拼接到目标基地址之后。
              </p>
            </div>

            <div className="field">
              <div className="field-inline">
                <span>自定义请求头</span>
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
                  添加请求头
                </button>
              </div>

              <div className="header-list">
                {value.customHeaders.length === 0 ? (
                  <div className="empty-hint">当前没有自定义头，请按需追加。</div>
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
