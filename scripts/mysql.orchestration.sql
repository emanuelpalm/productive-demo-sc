select
	sy.system_name as consumer,
    s2.system_name as provider,
	sd.service_definition as service,
    si.interface_name as interface,
    oc.priority
from arrowhead.orchestrator_store as oc
join arrowhead.system_ as sy on sy.id = oc.consumer_system_id
join arrowhead.system_ as s2 on s2.id = oc.provider_system_id
join arrowhead.service_definition as sd on sd.id = oc.service_id
join arrowhead.service_interface as si on si.id = oc.service_interface_id;