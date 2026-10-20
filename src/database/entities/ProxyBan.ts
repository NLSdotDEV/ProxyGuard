import { BaseEntity } from "#aegis/database";
import { Entity, Property, ManyToOne, Unique } from "@mikro-orm/decorators/es";
import { ProxyEndpoint } from "./ProxyEndpoint.js";
import { Ref } from "@mikro-orm/core";

@Entity({ tableName: 'proxy_bans' })
@Unique({ properties: ["hostTarget", "endpoint"] })
export class ProxyBan extends BaseEntity {
    @Property({ name: "host_target" })
    hostTarget!: string;

    @ManyToOne(() => ProxyEndpoint)
    endpoint!: Ref<ProxyEndpoint>
}